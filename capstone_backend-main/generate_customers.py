from faker import Faker
import random
import mysql.connector
from datetime import date, timedelta

# --- SETUP PARAMETERS ---
NUM_CUSTOMERS = 50

DB_CONFIG = {
    'user': 'root',
    'password': 'root',
    'host': 'localhost',
    'database': 'dunning_curing_db',
}

# --- FIXED DATA CHOICES ---
plan_types_postpaid = ['₹599 Monthly', '₹799 Monthly', '₹999 Monthly', '₹1299 Monthly']
plan_types_prepaid = ['1GB/day Plan', '1.5GB/day Plan', '2GB/day Plan', '3GB/day Plan']

customer_types = ['POSTPAID', 'PREPAID']
dunning_statuses = ['ACTIVE', 'NOTIFIED', 'RESTRICTED', 'BARRED', 'CURED']

# --- GENERATE FAKE CUSTOMERS ---
fake = Faker('en_IN')

def random_customer():
    type_choice = random.choice(customer_types)
    plan = random.choice(plan_types_postpaid if type_choice == 'POSTPAID' else plan_types_prepaid)
    overdue = random.choices([0]*4 + [random.randint(1, 30) for _ in range(6)], k=1)[0]
    outstanding = 0 if overdue == 0 else random.choice([299,399,549,599,699,799,999,1299])
    dunning_status = 'ACTIVE' if overdue == 0 else random.choice(dunning_statuses[1:])
    today = date.today()
    billing_date = (today - timedelta(days=random.randint(2, 28))).isoformat() if type_choice == 'POSTPAID' else None
    due_date = (today - timedelta(days=overdue)).isoformat() if overdue else (today + timedelta(days=7)).isoformat()

    return (
        fake.name(),
        fake.unique.email(),
        fake.phone_number(),
        type_choice,
        plan,
        billing_date,
        due_date,
        overdue,
        outstanding,
        dunning_status
    )

customers = [random_customer() for _ in range(NUM_CUSTOMERS)]

# --- PRINT SQL FOR MANUAL USE ---
print("-- SQL Inserts for customers")
for c in customers:
    vals = ["NULL" if x is None else f"'{x}'" if isinstance(x,str) else str(x) for x in c]
    print(f"INSERT INTO customers (name, email, phone, customer_type, plan_type, billing_date, due_date, overdue_days, outstanding_amount, dunning_status) VALUES ({', '.join(vals)});")

# --- OPTIONAL: Push data directly to MySQL ---
try:
    conn = mysql.connector.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("DELETE FROM customers")  # UNCOMMENT to clear old data
    for c in customers:
        cur.execute("""
        INSERT INTO customers
        (name, email, phone, customer_type, plan_type, billing_date, due_date, overdue_days, outstanding_amount, dunning_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, c)
    conn.commit()
    print(f"\n✅ Inserted {len(customers)} customers into the database.")
except Exception as e:
    print("Error inserting into database:", e)
finally:
    try:
        cur.close()
        conn.close()
    except:
        pass
