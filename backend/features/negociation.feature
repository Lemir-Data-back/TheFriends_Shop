# language: fr
Fonctionnalité: Négociation de prix en conversation libre sur une commande sur mesure
  Règle métier (CDC v2) : la négociation n'est possible que pour le sur mesure, se fait en
  conversation libre (contre-offres illimitées entre client et couturier), et respecte un
  plancher optionnel défini par le couturier sur l'article s'il en a fixé un.

  Contexte:
    Soit un client inscrit avec le téléphone "0700000010"
    Et un couturier inscrit avec le téléphone "0700000011" et une boutique nommée "Atelier Test"
    Et une commande sur mesure de 50000 FCFA du client "0700000010" vers le couturier "0700000011"

  Scénario: Le client propose un prix, le couturier accepte
    Quand le client "0700000010" propose un prix de 40000 FCFA
    Alors la requête réussit
    Et le montant de la commande est de 50000 FCFA
    Quand le couturier "0700000011" accepte le prix proposé
    Alors la requête réussit
    Et le montant de la commande est de 40000 FCFA

  Scénario: Le couturier refuse puis le client relance avec une nouvelle offre
    Quand le client "0700000010" propose un prix de 35000 FCFA
    Et le couturier "0700000011" refuse le prix proposé
    Alors la requête réussit
    Quand le client "0700000010" propose un prix de 42000 FCFA
    Alors la requête réussit
    Et le montant de la commande est de 50000 FCFA

  Scénario: Le couturier contre-offre directement au lieu d'accepter ou refuser
    Quand le client "0700000010" propose un prix de 35000 FCFA
    Et le couturier "0700000011" contre-offre un prix de 45000 FCFA
    Alors la requête réussit
    Quand le client "0700000010" accepte le prix proposé
    Alors la requête réussit
    Et le montant de la commande est de 45000 FCFA

  Scénario: Impossible de faire une deuxième offre tant que l'autre partie n'a pas répondu
    Quand le client "0700000010" propose un prix de 40000 FCFA
    Et le client "0700000010" propose un prix de 42000 FCFA
    Alors la requête échoue avec le code 400
    Et le message d'erreur contient "déjà en attente"

  Scénario: La négociation doit être ouverte par le client
    Quand le couturier "0700000011" contre-offre un prix de 45000 FCFA
    Alors la requête échoue avec le code 400
    Et le message d'erreur contient "ouverte par le client"

  Scénario: L'offre du client respecte le plancher de négociation défini sur l'article
    Soit un article sur mesure "Robe Wax" à 50000 FCFA avec un plancher de négociation de 40000 FCFA pour le couturier "0700000011"
    Et une commande sur mesure de 50000 FCFA sur cet article du client "0700000010" vers le couturier "0700000011"
    Quand le client "0700000010" propose un prix de 35000 FCFA
    Alors la requête échoue avec le code 400
    Et le message d'erreur contient "au moins 40000"
    Quand le client "0700000010" propose un prix de 40000 FCFA
    Alors la requête réussit
