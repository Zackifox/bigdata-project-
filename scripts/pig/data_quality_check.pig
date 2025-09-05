-- scripts/pig/data_quality_check.pig
-- Script de vérification de la qualité des données

-- Chargement des données
sales_data = LOAD 'mongodb://admin:bigdata123@mongodb:27017/bigdata.sales_data' 
    USING com.mongodb.hadoop.pig.MongoLoader('sale_id,product_id,customer_id,quantity,total_amount,date,status');

-- Vérification de la qualité des données
DESCRIBE sales_data;

-- 1. Détection des valeurs nulles
null_sales = FILTER sales_data BY 
    sale_id IS NULL OR 
    product_id IS NULL OR 
    customer_id IS NULL OR 
    quantity IS NULL OR 
    total_amount IS NULL;

null_count = FOREACH (GROUP null_sales ALL) GENERATE COUNT(null_sales) AS null_records;
DUMP null_count;

-- 2. Détection des valeurs négatives
negative_amounts = FILTER sales_data BY total_amount < 0 OR quantity < 0;
negative_count = FOREACH (GROUP negative_amounts ALL) GENERATE COUNT(negative_amounts) AS negative_records;
DUMP negative_count;

-- 3. Détection des doublons
grouped_sales = GROUP sales_data BY sale_id;
duplicate_sales = FILTER grouped_sales BY COUNT(sales_data) > 1;
duplicate_count = FOREACH (GROUP duplicate_sales ALL) GENERATE COUNT(duplicate_sales) AS duplicate_records;
DUMP duplicate_count;

-- 4. Statistiques générales
total_records = FOREACH (GROUP sales_data ALL) GENERATE COUNT(sales_data) AS total;
completed_sales = FILTER sales_data BY status == 'completed';
completed_count = FOREACH (GROUP completed_sales ALL) GENERATE COUNT(completed_sales) AS completed;

-- 5. Distribution des quantités
quantity_stats = FOREACH (GROUP sales_data ALL) GENERATE 
    MIN(sales_data.quantity) AS min_qty,
    MAX(sales_data.quantity) AS max_qty,
    AVG(sales_data.quantity) AS avg_qty;

DUMP quantity_stats;

-- 6. Distribution des montants
amount_stats = FOREACH (GROUP sales_data ALL) GENERATE 
    MIN(sales_data.total_amount) AS min_amount,
    MAX(sales_data.total_amount) AS max_amount,
    AVG(sales_data.total_amount) AS avg_amount;

DUMP amount_stats;

-- Rapport de qualité des données
quality_report = FOREACH (GROUP sales_data ALL) GENERATE 
    COUNT(sales_data) AS total_records,
    COUNT(sales_data.sale_id) AS non_null_sale_ids,
    COUNT(sales_data.total_amount) AS non_null_amounts;

STORE quality_report INTO '/pig/output/data_quality_report' USING PigStorage(',');