#!/usr/bin/env python3
# Script de génération de données d'exemple pour MongoDB

import pymongo
from datetime import datetime, timedelta
import random
from faker import Faker

def generate_sample_data():
    print("=== Génération de données d'exemple ===")
    
    # Connexion à MongoDB
    client = pymongo.MongoClient("mongodb://admin:bigdata123@localhost:27017/bigdata?authSource=admin")
    db = client.bigdata
    
    fake = Faker()
    
    # Génération de produits
    products = []
    categories = ["Electronics", "Furniture", "Appliances", "Sports", "Books"]
    
    for i in range(50):
        products.append({
            "product_id": f"P{i+1:03d}",
            "name": fake.catch_phrase(),
            "category": random.choice(categories),
            "price": round(random.uniform(10, 1000), 2),
            "stock": random.randint(10, 500)
        })
    
    # Génération de clients
    customers = []
    regions = ["North", "South", "East", "West", "Central"]
    
    for i in range(500):
        customers.append({
            "customer_id": f"C{i+1:04d}",
            "name": fake.name(),
            "email": fake.email(),
            "region": random.choice(regions),
            "registration_date": fake.date_between(start_date='-2y', end_date='today')
        })
    
    # Génération de ventes
    sales = []
    for i in range(5000):
        product = random.choice(products)
        customer = random.choice(customers)
        quantity = random.randint(1, 5)
        
        sales.append({
            "sale_id": f"S{i+1:06d}",
            "product_id": product["product_id"],
            "customer_id": customer["customer_id"],
            "quantity": quantity,
            "unit_price": product["price"],
            "total_amount": quantity * product["price"],
            "date": fake.date_between(start_date='-1y', end_date='today'),
            "region": customer["region"],
            "payment_method": random.choice(["credit_card", "debit_card", "cash"]),
            "status": "completed"
        })
    
    # Insertion des données
    print(f"Insertion de {len(products)} produits...")
    db.product_data.insert_many(products)
    
    print(f"Insertion de {len(customers)} clients...")
    db.customer_data.insert_many(customers)
    
    print(f"Insertion de {len(sales)} ventes...")
    db.sales_data.insert_many(sales)
    
    print("=== Données d'exemple générées avec succès ===")

if __name__ == "__main__":
    generate_sample_data()