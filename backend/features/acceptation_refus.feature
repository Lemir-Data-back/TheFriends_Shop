# language: fr
Fonctionnalité: Acceptation et refus d'une commande par le couturier/vendeur
  Règle métier : seul le vendeur/couturier propriétaire de la boutique peut
  traiter la commande ; l'acceptation d'une commande sur mesure fixe un délai
  de confection ; le refus déclenche le remboursement automatique du client.

  Contexte:
    Soit un client inscrit avec le téléphone "0700000020"
    Et un couturier inscrit avec le téléphone "0700000021" et une boutique nommée "Atelier Refus"
    Et une commande sur mesure de 45000 FCFA du client "0700000020" vers le couturier "0700000021"

  Scénario: Le couturier accepte la commande avec un délai de confection
    Quand le couturier "0700000021" accepte la commande avec un délai de 12 jours
    Alors la requête réussit
    Et le statut de la commande est "acceptee"
    Et la commande a un délai de confection de 12 jours

  Scénario: Le couturier refuse la commande — le client est remboursé
    Quand le couturier "0700000021" refuse la commande
    Alors la requête réussit
    Et le statut de la commande est "annule"
    Et le statut de l'escrow est "rembourse"

  Scénario: Accepter une commande négociée applique implicitement le prix accepté
    Quand le client "0700000020" propose un prix de 38000 FCFA
    Et le couturier "0700000021" accepte la commande avec un délai de 5 jours
    Alors le montant de la commande est de 38000 FCFA
