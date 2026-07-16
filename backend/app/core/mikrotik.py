import socket
import time
import hashlib

class MikroTikClient:
    def __init__(self, host: str, port: int = 8728, username: str = "admin", password: str = ""):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.socket = None

    def connect(self) -> bool:
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(3.5)
            self.socket.connect((self.host, self.port))
            return True
        except Exception as e:
            self.socket = None
            raise Exception(f"Socket connection to {self.host}:{self.port} failed: {e}")

    def send_word(self, word: str):
        b_word = word.encode('utf-8')
        length = len(b_word)
        if length < 0x80:
            header = bytes([length])
        elif length < 0x4000:
            length |= 0x8000
            header = bytes([length >> 8, length & 0xFF])
        elif length < 0x200000:
            length |= 0xC00000
            header = bytes([length >> 16, (length >> 8) & 0xFF, length & 0xFF])
        else:
            header = bytes([0xF0, length >> 24, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF])
        self.socket.sendall(header + b_word)

    def read_word(self) -> str:
        b = self.socket.recv(1)
        if not b:
            return ""
        length = b[0]
        if (length & 0x80) == 0x00:
            pass
        elif (length & 0xC0) == 0x80:
            b2 = self.socket.recv(1)
            length = ((length & 0x3F) << 8) + b2[0]
        elif (length & 0xE0) == 0xC0:
            b2 = self.socket.recv(2)
            length = ((length & 0x1F) << 16) + (b2[0] << 8) + b2[1]
        elif (length & 0xF0) == 0xE0:
            b2 = self.socket.recv(3)
            length = ((length & 0x0F) << 24) + (b2[0] << 16) + (b2[1] << 8) + b2[2]
        elif (length & 0xF8) == 0xF0:
            b2 = self.socket.recv(4)
            length = (b2[0] << 24) + (b2[1] << 16) + (b2[2] << 8) + b2[3]
        
        if length == 0:
            return ""
        
        data = bytearray()
        while len(data) < length:
            chunk = self.socket.recv(length - len(data))
            if not chunk:
                break
            data.extend(chunk)
        return data.decode('utf-8', errors='ignore')

    def send_sentence(self, cmd: str, words: list = []) -> list:
        if not self.socket:
            self.connect()
        
        self.send_word(cmd)
        for w in words:
            self.send_word(w)
        self.send_word("") # empty word finishes sentence
        
        # Read sentences
        response = []
        while True:
            sentence = []
            while True:
                w = self.read_word()
                if w == "":
                    break
                sentence.append(w)
            if not sentence:
                break
            response.append(sentence)
            if sentence[0] in ["!done", "!trap", "!fatal"]:
                break
        return response

    def login(self) -> bool:
        if not self.socket:
            self.connect()
            
        # RouterOS v6+ unified login handshake
        response = self.send_sentence("/login", [f"=name={self.username}", f"=password={self.password}"])
        
        # Handle older RouterOS v5/v6 challenge md5 handshake if present
        for sentence in response:
            if sentence[0] == "!trap":
                raise Exception("Authentication rejected by router credentials policy.")
            if sentence[0] == "!done" and len(sentence) > 1:
                # Challenge-based protocol
                for word in sentence:
                    if word.startswith("=ret="):
                        challenge = word[5:]
                        # md5 hex string hashing
                        hash_input = b"\x00" + self.password.encode('utf-8') + bytes.fromhex(challenge)
                        hashed = hashlib.md5(hash_input).hexdigest()
                        
                        confirm_resp = self.send_sentence("/login", [
                            f"=name={self.username}",
                            f"=response=00{hashed}"
                        ])
                        for cs in confirm_resp:
                            if cs[0] in ["!trap", "!fatal"]:
                                raise Exception("Challenge verification failed. Authentication rejected.")
                        return True
        return True

    def close(self):
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None

    def get_system_resources(self) -> dict:
        sentences = self.send_sentence("/system/resource/print")
        resources = {}
        for s in sentences:
            if s[0] == "!re" or s[0] == "!done":
                for w in s:
                    if w.startswith("=cpu-load="):
                        resources["cpu_load"] = int(w[10:])
                    elif w.startswith("=free-memory="):
                        resources["free_memory"] = int(w[13:])
                    elif w.startswith("=total-memory="):
                        resources["total_memory"] = int(w[14:])
                    elif w.startswith("=uptime="):
                        resources["uptime"] = w[8:]
        return resources

    def ppp_secret_add(self, name: str, password: str, profile: str) -> bool:
        sentences = self.send_sentence("/ppp/secret/add", [
            f"=name={name}",
            f"=password={password}",
            f"=profile={profile}",
            "=service=pppoe"
        ])
        for s in sentences:
            if s[0] == "!trap" or s[0] == "!fatal":
                return False
        return True

    def ppp_secret_set(self, name: str, password: str = None, profile: str = None, disabled: bool = None) -> bool:
        words = [f"=numbers={name}"] # RouterOS expects identifier or filter
        # But we can also set by name filter
        # Get target id
        target_id = self.get_ppp_secret_id(name)
        if not target_id:
            return False
            
        words = [f"=.id={target_id}"]
        if password is not None:
            words.append(f"=password={password}")
        if profile is not None:
            words.append(f"=profile={profile}")
        if disabled is not None:
            words.append(f"=disabled={'yes' if disabled else 'no'}")
            
        sentences = self.send_sentence("/ppp/secret/set", words)
        for s in sentences:
            if s[0] == "!trap" or s[0] == "!fatal":
                return False
        return True

    def ppp_secret_remove(self, name: str) -> bool:
        target_id = self.get_ppp_secret_id(name)
        if not target_id:
            return False
        sentences = self.send_sentence("/ppp/secret/remove", [f"=.id={target_id}"])
        for s in sentences:
            if s[0] == "!trap" or s[0] == "!fatal":
                return False
        return True

    def get_ppp_secret_id(self, name: str) -> str:
        sentences = self.send_sentence("/ppp/secret/print", [f"?name={name}"])
        for s in sentences:
            if s[0] == "!re":
                for w in s:
                    if w.startswith("=.id="):
                        return w[5:]
        return None

    def get_active_pppoe_users(self) -> list:
        sentences = self.send_sentence("/ppp/active/print")
        users = []
        for s in sentences:
            if s[0] == "!re":
                user_data = {}
                for w in s:
                    if w.startswith("=name="):
                        user_data["name"] = w[6:]
                    elif w.startswith("=address="):
                        user_data["address"] = w[9:]
                    elif w.startswith("=caller-id="):
                        user_data["caller_id"] = w[11:]
                    elif w.startswith("=uptime="):
                        user_data["uptime"] = w[8:]
                users.append(user_data)
        return users

    def hotspot_user_add(self, name: str, password: str, profile: str) -> bool:
        sentences = self.send_sentence("/ip/hotspot/user/add", [
            f"=name={name}",
            f"=password={password}",
            f"=profile={profile}",
            "=limit-uptime=0"
        ])
        for s in sentences:
            if s[0] == "!trap" or s[0] == "!fatal":
                return False
        return True

    def hotspot_user_set(self, name: str, password: str = None, profile: str = None, disabled: bool = None) -> bool:
        target_id = self.get_hotspot_user_id(name)
        if not target_id:
            return False
        words = [f"=.id={target_id}"]
        if password is not None:
            words.append(f"=password={password}")
        if profile is not None:
            words.append(f"=profile={profile}")
        if disabled is not None:
            words.append(f"=disabled={'yes' if disabled else 'no'}")
            
        sentences = self.send_sentence("/ip/hotspot/user/set", words)
        for s in sentences:
            if s[0] == "!trap" or s[0] == "!fatal":
                return False
        return True

    def get_hotspot_user_id(self, name: str) -> str:
        sentences = self.send_sentence("/ip/hotspot/user/print", [f"?name={name}"])
        for s in sentences:
            if s[0] == "!re":
                for w in s:
                    if w.startswith("=.id="):
                        return w[5:]
        return None
