"""Steps réutilisables : inscription, connexion, création de commande de test."""
from behave import given, when, then
from app.db.base import SessionLocal
from app.modules.commandes.models import Order, OrderType, OrderStatut, EscrowStatut

API = "/api/v1"


def _register(context, role, telephone, nom="Test", shop_nom=None):
    payload = {
        "full_name": nom,
        "phone": telephone,
        "password": "test1234",
        "role": role,
    }
    if shop_nom:
        payload["shop_nom"] = shop_nom
    resp = context.client.post(f"{API}/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    context.tokens[telephone] = data["access_token"]
    context.users[telephone] = data["user"]["id"]
    return data


def _headers(context, telephone):
    return {"Authorization": f"Bearer {context.tokens[telephone]}"}


@given('un client inscrit avec le téléphone "{telephone}"')
def step_client_inscrit(context, telephone):
    _register(context, "client", telephone, "Client Test")


@given('un couturier inscrit avec le téléphone "{telephone}" et une boutique nommée "{nom_boutique}"')
def step_couturier_avec_boutique(context, telephone, nom_boutique):
    # L'inscription couturier/vendeur crée déjà la boutique dans la même transaction
    # (shop_nom obligatoire) — pas de second appel à POST /shops, qui refuserait
    # désormais une deuxième boutique pour le même compte.
    _register(context, "couturier", telephone, "Couturier Test", shop_nom=nom_boutique)
    resp = context.client.get(f"{API}/shops/me/shop", headers=_headers(context, telephone))
    assert resp.status_code == 200, resp.text
    context.shops[telephone] = resp.json()["id"]


@given('une commande sur mesure de {montant:d} FCFA du client "{client_tel}" vers le couturier "{couturier_tel}"')
def step_commande_sur_mesure(context, montant, client_tel, couturier_tel):
    db = SessionLocal()
    order = Order(
        reference=f"TF-TEST-{client_tel}-{couturier_tel}",
        client_id=context.users[client_tel],
        shop_id=context.shops[couturier_tel],
        type=OrderType.SUR_MESURE,
        statut=OrderStatut.EN_ATTENTE,
        montant=montant,
        escrow_statut=EscrowStatut.BLOQUE,
        items=[{"product_id": 1, "titre": "Article test", "taille": "M", "couleur": "noir", "quantite": 1, "prix": montant}],
    )
    db.add(order)
    db.commit()
    context.orders["courante"] = order.id
    db.close()


@then("la requête réussit")
def step_requete_reussit(context):
    assert context.response.status_code < 300, context.response.text


@then("la requête échoue avec le code {code:d}")
def step_requete_echoue(context, code):
    assert context.response.status_code == code, (
        f"attendu {code}, reçu {context.response.status_code} : {context.response.text}"
    )


@then('le message d\'erreur contient "{texte}"')
def step_message_erreur_contient(context, texte):
    detail = context.response.json().get("detail", "")
    assert texte in str(detail), f"'{texte}' absent de : {detail}"
