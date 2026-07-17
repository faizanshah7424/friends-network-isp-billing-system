# Sample Plugin for Friends Network ISP ERP
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
