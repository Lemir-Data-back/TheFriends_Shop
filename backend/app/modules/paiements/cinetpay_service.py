import httpx
import hashlib
from datetime import datetime

from app.core.config import settings


CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2"


def _generate_transaction_id(order_ref: str) -> str:
    """Génère un identifiant de transaction unique basé sur la référence commande."""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"TF_{order_ref}_{timestamp}"


async def initier_paiement(
    transaction_id: str,
    montant: int,
    description: str,
    return_url: str,
    notify_url: str,
    telephone: str | None = None,
    canal: str = "ALL",
) -> dict:
    """
    Initie un paiement CinetPay et retourne l'URL de paiement.
    Canal : ALL | MOBILE_MONEY | CREDIT_CARD | WALLET
    """
    payload = {
        "apikey": settings.CINETPAY_API_KEY,
        "site_id": settings.CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
        "amount": montant,
        "currency": "XOF",
        "description": description,
        "return_url": return_url,
        "notify_url": notify_url,
        "channels": canal,
        "lang": "fr",
        "metadata": transaction_id,
    }

    if telephone:
        payload["customer_phone_number"] = telephone
        payload["customer_name"] = "Client TheFriends"
        payload["customer_surname"] = ""
        payload["customer_email"] = "client@thefriends.ci"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{CINETPAY_BASE_URL}/payment",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        data = response.json()

    if data.get("code") != "201":
        raise ValueError(
            f"CinetPay erreur: {data.get('message', 'Erreur inconnue')}"
        )

    return {
        "payment_url": data["data"]["payment_url"],
        "transaction_id": transaction_id,
    }


async def verifier_paiement(transaction_id: str) -> dict:
    """Vérifie le statut d'un paiement CinetPay."""
    payload = {
        "apikey": settings.CINETPAY_API_KEY,
        "site_id": settings.CINETPAY_SITE_ID,
        "transaction_id": transaction_id,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{CINETPAY_BASE_URL}/payment/check",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        data = response.json()

    return data


def verifier_signature_webhook(payload: dict, secret: str) -> bool:
    """Vérifie la signature HMAC du webhook CinetPay."""
    received_sig = payload.get("signature", "")
    data_to_sign = (
        f"{payload.get('cpm_site_id', '')}"
        f"{payload.get('cpm_trans_id', '')}"
        f"{payload.get('cpm_amount', '')}"
        f"{payload.get('cpm_currency', '')}"
        f"{secret}"
    )
    expected_sig = hashlib.sha256(data_to_sign.encode()).hexdigest()
    return received_sig == expected_sig
