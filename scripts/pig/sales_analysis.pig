-- scripts/pig/sales_analysis.pig
-- Analyse des données de ventes avec Apache Pig

-- Configuration
SET job.name 'Sales_Data_Analysis';
SET default_parallel 3;

-- Enregistrement des JAR MongoDB pour Pig
REGISTER /opt/hadoop/share/hadoop/common/lib/mongo-hadoop-core-2.0.2.jar;
REGISTER /opt/hadoop/share/hadoop/common/lib/mongodb-driver-3.12.11.jar;
REGISTER /opt/hadoop/share/hadoop/common/lib/bson-3.12.11.jar;

-- Définition de la fonction de chargement MongoDB
DEFINE MongoLoader com.mongodb.hadoop.pig.MongoLoader();

-- Chargement des données de ventes depuis MongoDB
sales_data = LOAD 'mongodb://admin:bigdata123@mongodb:27017/bigdata.sales_data' 
    USING MongoLoader('sale_id,product_id,customer_id,quantity,unit_price,total_amount,date,region,payment_method,status', 'id');

-- Nettoyage et filtrage des données
clean_sales = FILTER sales_data BY status == 'completed' AND total_amount > 0;

-- Analyse 1: Ventes par région
DESCRIBE clean_sales;
sales_by_region = GROUP clean_sales BY region;
region_summary = FOREACH sales_by_region GENERATE 
    group AS region,
    COUNT(clean_sales) AS total_orders,
    SUM(clean_sales.total_amount) AS total_revenue,
    AVG(clean_sales.total_amount) AS avg_order_value,
    SUM(clean_sales.quantity) AS total_quantity;

-- Tri par revenus décroissants
region_summary_sorted = ORDER region_summary BY total_revenue DESC;

-- Stockage des résultats
STORE region_summary_sorted INTO '/pig/output/sales_by_region' USING PigStorage(',');

-- Analyse 2: Performance des produits
product_sales = GROUP clean_sales BY product_id;
product_performance = FOREACH product_sales GENERATE 
    group AS product_id,
    COUNT(clean_sales) AS order_count,
    SUM(clean_sales.quantity) AS total_quantity_sold,
    SUM(clean_sales.total_amount) AS total_revenue,
    AVG(clean_sales.unit_price) AS avg_unit_price,
    MIN(clean_sales.unit_price) AS min_price,
    MAX(clean_sales.unit_price) AS max_price;

-- Top 10 des produits par revenus
top_products = ORDER product_performance BY total_revenue DESC;
top_10_products = LIMIT top_products 10;

STORE top_10_products INTO '/pig/output/top_products' USING PigStorage(',');

-- Analyse 3: Tendances temporelles (par mois)
-- Extraction du mois et de l'année
sales_with_month = FOREACH clean_sales GENERATE 
    *,
    ToString(date, 'yyyy-MM') AS year_month;

monthly_sales = GROUP sales_with_month BY year_month;
monthly_summary = FOREACH monthly_sales GENERATE 
    group AS year_month,
    COUNT(sales_with_month) AS monthly_orders,
    SUM(sales_with_month.total_amount) AS monthly_revenue,
    AVG(sales_with_month.total_amount) AS avg_monthly_order,
    SUM(sales_with_month.quantity) AS monthly_quantity;

monthly_sorted = ORDER monthly_summary BY year_month;
STORE monthly_sorted INTO '/pig/output/monthly_trends' USING PigStorage(',');

-- Analyse 4: Analyse par méthode de paiement
payment_analysis = GROUP clean_sales BY payment_method;
payment_summary = FOREACH payment_analysis GENERATE 
    group AS payment_method,
    COUNT(clean_sales) AS transaction_count,
    SUM(clean_sales.total_amount) AS total_revenue,
    AVG(clean_sales.total_amount) AS avg_transaction_amount,
    (double)COUNT(clean_sales) / (double)COUNT(clean_sales) * 100 AS percentage;

-- Calcul du pourcentage correct
all_sales_count = FOREACH (GROUP clean_sales ALL) GENERATE COUNT(clean_sales) AS total;
payment_with_pct = FOREACH payment_summary GENERATE 
    payment_method,
    transaction_count,
    total_revenue,
    avg_transaction_amount,
    (double)transaction_count / 10000.0 * 100 AS percentage;

STORE payment_with_pct INTO '/pig/output/payment_analysis' USING PigStorage(',');

-- Analyse 5: Segmentation des clients par valeur
customer_analysis = GROUP clean_sales BY customer_id;
customer_summary = FOREACH customer_analysis GENERATE 
    group AS customer_id,
    COUNT(clean_sales) AS order_frequency,
    SUM(clean_sales.total_amount) AS total_spent,
    AVG(clean_sales.total_amount) AS avg_order_value,
    MAX(clean_sales.total_amount) AS max_order_value;

-- Segmentation des clients
customer_segments = FOREACH customer_summary GENERATE 
    customer_id,
    order_frequency,
    total_spent,
    avg_order_value,
    (total_spent >= 5000 ? 'High Value' : 
     (total_spent >= 2000 ? 'Medium Value' : 'Low Value')) AS customer_segment;

segment_analysis = GROUP customer_segments BY customer_segment;
segment_summary = FOREACH segment_analysis GENERATE 
    group AS segment,
    COUNT(customer_segments) AS customer_count,
    AVG(customer_segments.total_spent) AS avg_customer_value,
    SUM(customer_segments.total_spent) AS segment_revenue;

STORE segment_summary INTO '/pig/output/customer_segments' USING PigStorage(',');

-- Affichage des résultats dans les logs
DUMP region_summary_sorted;
DUMP top_10_products;

---