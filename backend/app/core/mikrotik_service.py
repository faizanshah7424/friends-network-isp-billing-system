from sqlalchemy.orm import Session
from backend.app.models.customer import Customer
from backend.app.models.router import Router
from backend.app.core.mikrotik import MikroTikClient
from backend.app.core.security import decrypt_password

def sync_customer_to_router(db: Session, customer: Customer, disable: bool = False):
    if not customer.router_id:
        return
        
    router = db.query(Router).filter(Router.id == customer.router_id).first()
    if not router:
        return

    pwd = decrypt_password(router.password_encrypted)
    client = MikroTikClient(
        host=router.ip_address,
        port=router.api_port,
        username=router.username,
        password=pwd
    )

    try:
        client.connect()
        client.login()
        
        # PPPoE Sync
        if customer.connection_type == "PPPoE" and customer.ppp_username:
            exists = client.get_ppp_secret_id(customer.ppp_username)
            if not exists:
                client.ppp_secret_add(customer.ppp_username, customer.ppp_password or "123456", customer.package_name)
            client.ppp_secret_set(
                name=customer.ppp_username,
                password=customer.ppp_password,
                profile=customer.package_name,
                disabled=disable
            )
            
        # Hotspot Sync
        elif customer.connection_type == "Hotspot" and customer.hotspot_username:
            exists = client.get_hotspot_user_id(customer.hotspot_username)
            if not exists:
                client.hotspot_user_add(customer.hotspot_username, customer.hotspot_password or "123456", customer.package_name)
            client.hotspot_user_set(
                name=customer.hotspot_username,
                password=customer.hotspot_password,
                profile=customer.package_name,
                disabled=disable
            )
            
        client.close()
    except Exception as e:
        print(f"Failed to auto-sync customer {customer.customer_id} on router {router.name}: {e}")
