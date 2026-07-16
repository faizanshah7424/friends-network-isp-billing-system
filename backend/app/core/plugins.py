import os
import sys
import importlib.util
from typing import Dict, Any

class PluginSystem:
    def __init__(self, plugins_dir: str = "backend/plugins"):
        self.plugins_dir = plugins_dir
        self.loaded_plugins: Dict[str, Any] = {}

    def scan_and_load_plugins(self):
        """
        Dynamically scan the plugins directory and load any Python scripts.
        Each plugin should define a hook 'register_plugin()' to hook into the system.
        """
        if not os.path.exists(self.plugins_dir):
            os.makedirs(self.plugins_dir, exist_ok=True)
            # Create a mock/sample plugin for demonstration
            self._create_sample_plugin()
            
        print(f"[Plugin System] Scanning for third-party extensions in {self.plugins_dir}...")
        for filename in os.listdir(self.plugins_dir):
            if filename.endswith(".py") and not filename.startswith("__"):
                plugin_name = filename[:-3]
                plugin_path = os.path.join(self.plugins_dir, filename)
                
                try:
                    spec = importlib.util.spec_from_file_location(plugin_name, plugin_path)
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        sys.modules[plugin_name] = module
                        spec.loader.exec_module(module)
                        
                        # Trigger register hook
                        if hasattr(module, "register_plugin"):
                            registration_info = module.register_plugin()
                            self.loaded_plugins[plugin_name] = {
                                "module": module,
                                "info": registration_info
                            }
                            print(f"[Plugin System] Loaded plugin: '{plugin_name}' successfully - Info: {registration_info}")
                except Exception as e:
                    print(f"[Plugin System] Failed to load plugin '{plugin_name}': {e}")

    def _create_sample_plugin(self):
        sample_code = """# Sample Plugin for Friends Network ISP ERP
def register_plugin():
    return {
        "name": "SMS Gateway Pro Extension",
        "version": "1.0.0",
        "description": "Integrates third-party SMS marketing endpoints",
        "author": "External Developer"
    }

def on_payment_received(payment_data: dict):
    # Plugin callback simulation
    print(f"[SMS Plugin Callback] Payment received notification triggered: {payment_data}")
"""
        with open(os.path.join(self.plugins_dir, "sms_gateway_pro.py"), "w") as f:
            f.write(sample_code)

# Initialize global plugin manager
plugin_manager = PluginSystem()
