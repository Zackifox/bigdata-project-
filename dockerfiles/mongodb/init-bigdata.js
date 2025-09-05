// dockerfiles/mongodb/init-bigdata.js
// Script d'initialisation pour la base de données Big Data

print("=== Initialisation de la base de données BigData ===");

// Connexion à la base de données
db = db.getSiblingDB('bigdata');

// Création de l'utilisateur pour l'application
db.createUser({
  user: "bigdata_user",
  pwd: "bigdata123",
  roles: [
    {
      role: "readWrite",
      db: "bigdata"
    }
  ]
});

print("Utilisateur bigdata_user créé avec succès");

// Création des collections principales
db.createCollection("sales_data");
db.createCollection("customer_data");
db.createCollection("product_data");
db.createCollection("analytics_results");
db.createCollection("logs");

print("Collections créées avec succès");

// Index pour optimiser les requêtes
db.sales_data.createIndex({ "date": 1 });
db.sales_data.createIndex({ "customer_id": 1 });
db.sales_data.createIndex({ "product_id": 1 });
db.sales_data.createIndex({ "region": 1 });

db.customer_data.createIndex({ "customer_id": 1 }, { unique: true });
db.customer_data.createIndex({ "email": 1 }, { unique: true });
db.customer_data.createIndex({ "registration_date": 1 });

db.product_data.createIndex({ "product_id": 1 }, { unique: true });
db.product_data.createIndex({ "category": 1 });
db.product_data.createIndex({ "price": 1 });

print("Index créés avec succès");

// Insertion de données d'exemple pour les ventes
print("Insertion de données d'exemple...");

// Données produits
var products = [
  { product_id: "P001", name: "Laptop Pro", category: "Electronics", price: 1299.99, stock: 150 },
  { product_id: "P002", name: "Smartphone X", category: "Electronics", price: 899.99, stock: 200 },
  { product_id: "P003", name: "Wireless Headphones", category: "Electronics", price: 199.99, stock: 300 },
  { product_id: "P004", name: "Office Chair", category: "Furniture", price: 299.99, stock: 100 },
  { product_id: "P005", name: "Standing Desk", category: "Furniture", price: 599.99, stock: 75 },
  { product_id: "P006", name: "Coffee Maker", category: "Appliances", price: 149.99, stock: 120 },
  { product_id: "P007", name: "Blender", category: "Appliances", price: 89.99, stock: 180 },
  { product_id: "P008", name: "Running Shoes", category: "Sports", price: 129.99, stock: 250 },
  { product_id: "P009", name: "Yoga Mat", category: "Sports", price: 39.99, stock: 400 },
  { product_id: "P010", name: "Water Bottle", category: "Sports", price: 24.99, stock: 500 }
];

db.product_data.insertMany(products);
print("Données produits insérées: " + products.length + " produits");

// Données clients
var customers = [];
var regions = ["North", "South", "East", "West", "Central"];
for (var i = 1; i <= 1000; i++) {
  customers.push({
    customer_id: "C" + i.toString().padStart(4, '0'),
    name: "Customer " + i,
    email: "customer" + i + "@email.com",
    region: regions[Math.floor(Math.random() * regions.length)],
    registration_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    total_purchases: 0,
    status: "active"
  });
}

db.customer_data.insertMany(customers);
print("Données clients insérées: " + customers.length + " clients");

// Données de ventes (simulation de données historiques)
var sales = [];
var productIds = products.map(p => p.product_id);
var customerIds = customers.map(c => c.customer_id);
var salesRegions = ["North", "South", "East", "West", "Central"];

for (var i = 1; i <= 10000; i++) {
  var product = products[Math.floor(Math.random() * products.length)];
  var customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
  var quantity = Math.floor(Math.random() * 5) + 1;
  var saleDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  
  sales.push({
    sale_id: "S" + i.toString().padStart(6, '0'),
    product_id: product.product_id,
    customer_id: customerId,
    quantity: quantity,
    unit_price: product.price,
    total_amount: quantity * product.price,
    date: saleDate,
    region: salesRegions[Math.floor(Math.random() * salesRegions.length)],
    payment_method: ["credit_card", "debit_card", "cash", "bank_transfer"][Math.floor(Math.random() * 4)],
    status: "completed"
  });
}

// Insertion par batch pour optimiser les performances
var batchSize = 1000;
for (var i = 0; i < sales.length; i += batchSize) {
  var batch = sales.slice(i, i + batchSize);
  db.sales_data.insertMany(batch);
  print("Batch " + Math.ceil((i + 1) / batchSize) + " inséré");
}

print("Données de ventes insérées: " + sales.length + " ventes");

// Création de vues pour l'analyse
db.createView(
  "monthly_sales_summary",
  "sales_data",
  [
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          region: "$region"
        },
        total_sales: { $sum: "$total_amount" },
        total_quantity: { $sum: "$quantity" },
        avg_sale_amount: { $avg: "$total_amount" },
        unique_customers: { $addToSet: "$customer_id" }
      }
    },
    {
      $project: {
        year: "$_id.year",
        month: "$_id.month",
        region: "$_id.region",
        total_sales: 1,
        total_quantity: 1,
        avg_sale_amount: 1,
        unique_customers_count: { $size: "$unique_customers" }
      }
    },
    {
      $sort: { "year": 1, "month": 1, "region": 1 }
    }
  ]
);

print("Vue monthly_sales_summary créée");

db.createView(
  "product_performance",
  "sales_data",
  [
    {
      $lookup: {
        from: "product_data",
        localField: "product_id",
        foreignField: "product_id",
        as: "product_info"
      }
    },
    {
      $unwind: "$product_info"
    },
    {
      $group: {
        _id: "$product_id",
        product_name: { $first: "$product_info.name" },
        category: { $first: "$product_info.category" },
        total_quantity_sold: { $sum: "$quantity" },
        total_revenue: { $sum: "$total_amount" },
        avg_price: { $avg: "$unit_price" },
        total_orders: { $sum: 1 }
      }
    },
    {
      $sort: { total_revenue: -1 }
    }
  ]
);

print("Vue product_performance créée");

// Configuration pour les performances
db.runCommand({
  "collMod": "sales_data",
  "validator": {
    $jsonSchema: {
      bsonType: "object",
      required: ["sale_id", "product_id", "customer_id", "quantity", "total_amount", "date"],
      properties: {
        sale_id: { bsonType: "string" },
        product_id: { bsonType: "string" },
        customer_id: { bsonType: "string" },
        quantity: { bsonType: "int", minimum: 1 },
        total_amount: { bsonType: "double", minimum: 0 },
        date: { bsonType: "date" }
      }
    }
  }
});

print("=== Initialisation terminée avec succès ===");
print("Collections créées: " + db.getCollectionNames().length);
print("Total des documents:");
print("- Products: " + db.product_data.countDocuments({}));
print("- Customers: " + db.customer_data.countDocuments({}));
print("- Sales: " + db.sales_data.countDocuments({}));
print("=======================================");