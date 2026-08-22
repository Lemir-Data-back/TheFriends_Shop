"""Steps spécifiques à la négociation de prix (conversation libre) et au traitement des commandes."""
from behave import given, when, then
from app.db.base import SessionLocal
from app.modules.commandes.models import Order, OrderType, OrderStatut, EscrowStatut
from app.modules.produits.models import Product, ProductCategorie

API = "/api/v1"


def _headers(context, telephone):
    return {"Authorization": f"Bearer {context.tokens[telephone]}"}


def _order_id(context):
    return context.orders["courante"]


def _action_type(context) -> str:
    """Le tout premier tour d'une négociation est 'proposer', tous les suivants sont 'contre'."""
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == _order_id(context)).first()
    nb = len(order.negociations or [])
    db.close()
    return "proposer" if nb == 0 else "contre"


@given('un article sur mesure "{titre}" à {prix:d} FCFA avec un plancher de négociation de {plancher:d} FCFA pour le couturier "{telephone}"')
def step_article_avec_plancher(context, titre, prix, plancher, telephone):
    db = SessionLocal()
    product = Product(
        shop_id=context.shops[telephone],
        titre=titre,
        categorie=ProductCategorie.FEMME,
        prix=prix,
        is_sur_mesure=True,
        prix_plancher_negociation=plancher,
    )
    db.add(product)
    db.commit()
    context.dernier_produit_id = product.id
    db.close()


@given('une commande sur mesure de {montant:d} FCFA sur cet article du client "{client_tel}" vers le couturier "{couturier_tel}"')
def step_commande_sur_article(context, montant, client_tel, couturier_tel):
    db = SessionLocal()
    order = Order(
        reference=f"TF-TEST-ART-{client_tel}-{couturier_tel}",
        client_id=context.users[client_tel],
        shop_id=context.shops[couturier_tel],
        type=OrderType.SUR_MESURE,
        statut=OrderStatut.EN_ATTENTE,
        montant=montant,
        escrow_statut=EscrowStatut.BLOQUE,
        items=[{
            "product_id": context.dernier_produit_id,
            "titre": "Article test", "taille": "M", "couleur": "noir",
            "quantite": 1, "prix": montant,
        }],
    )
    db.add(order)
    db.commit()
    context.orders["courante"] = order.id
    db.close()


@when('le client "{telephone}" propose un prix de {prix:d} FCFA')
def step_client_propose_prix(context, telephone, prix):
    context.response = context.client.post(
        f"{API}/orders/{_order_id(context)}/negociation",
        json={"action": _action_type(context), "prix": prix},
        headers=_headers(context, telephone),
    )


@when('le couturier "{telephone}" contre-offre un prix de {prix:d} FCFA')
def step_couturier_contre_offre(context, telephone, prix):
    context.response = context.client.post(
        f"{API}/orders/{_order_id(context)}/negociation",
        json={"action": _action_type(context), "prix": prix},
        headers=_headers(context, telephone),
    )


@when('le couturier "{telephone}" accepte le prix proposé')
def step_couturier_accepte_prix(context, telephone):
    context.response = context.client.post(
        f"{API}/orders/{_order_id(context)}/negociation",
        json={"action": "accepter"},
        headers=_headers(context, telephone),
    )


@when('le client "{telephone}" accepte le prix proposé')
def step_client_accepte_prix(context, telephone):
    context.response = context.client.post(
        f"{API}/orders/{_order_id(context)}/negociation",
        json={"action": "accepter"},
        headers=_headers(context, telephone),
    )


@when('le couturier "{telephone}" refuse le prix proposé')
def step_couturier_refuse_prix(context, telephone):
    context.response = context.client.post(
        f"{API}/orders/{_order_id(context)}/negociation",
        json={"action": "refuser"},
        headers=_headers(context, telephone),
    )


@when('le couturier "{telephone}" accepte la commande avec un délai de {jours:d} jours')
def step_couturier_accepte_commande(context, telephone, jours):
    context.response = context.client.patch(
        f"{API}/orders/{_order_id(context)}/statut",
        json={"statut": "acceptee", "delai_jours": jours},
        headers=_headers(context, telephone),
    )


@when('le couturier "{telephone}" refuse la commande')
def step_couturier_refuse_commande(context, telephone):
    context.response = context.client.patch(
        f"{API}/orders/{_order_id(context)}/statut",
        json={"statut": "annule"},
        headers=_headers(context, telephone),
    )


def _get_order(context):
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == _order_id(context)).first()
    db.expunge(order)
    db.close()
    return order


@then("le montant de la commande est de {montant:d} FCFA")
def step_montant_commande(context, montant):
    assert _get_order(context).montant == montant


@then('le statut de la commande est "{statut}"')
def step_statut_commande(context, statut):
    assert _get_order(context).statut.value == statut


@then('le statut de l\'escrow est "{statut}"')
def step_statut_escrow(context, statut):
    assert _get_order(context).escrow_statut.value == statut


@then("la commande a un délai de confection de {jours:d} jours")
def step_delai_confection(context, jours):
    assert _get_order(context).delai_confection_jours == jours
