from faker import Faker
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.umkm import UMKM
from app.models.product import Product
from app.models.customer import Customer
from app.models.transaction import Transaction, TransactionItem
from app.core.security import get_password_hash
import random
from datetime import datetime, timedelta

fake = Faker('id_ID')


def create_tables():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


def generate_users(db, count=20):
    print(f"\nGenerating {count} users...")
    users = []

    # Create admin user
    admin = User(
        email="admin@garudaai.com",
        name="Admin GarudaAI",
        hashed_password=get_password_hash("admin123"),
        phone="081234567890",
        role="admin",
        is_active=True
    )
    db.add(admin)
    users.append(admin)
    print(f"✓ Created admin user: {admin.email}")

    # Create regular test user
    test_user = User(
        email="user@example.com",
        name="John Doe",
        hashed_password=get_password_hash("secret"),
        phone="081234567891",
        role="user",
        is_active=True
    )
    db.add(test_user)
    users.append(test_user)
    print(f"✓ Created test user: {test_user.email}")

    # Generate random users
    for i in range(count - 2):
        user = User(
            email=fake.email(),
            name=fake.name(),
            hashed_password=get_password_hash("password123"),
            phone=fake.phone_number(),
            role=random.choice(["user", "user", "user", "manager"]),
            is_active=random.choice([True, True, True, False])
        )
        db.add(user)
        users.append(user)
        print(f"✓ Created user {i+3}/{count}: {user.email}")

    db.commit()
    print(f"\n✅ Successfully created {count} users!")
    return users


def generate_umkm(db, users, count=50):
    print(f"\nGenerating {count} UMKM businesses...")

    business_types = [
        "Kuliner", "Fashion", "Kerajinan Tangan", "Jasa", "Pertanian",
        "Perikanan", "Peternakan", "Teknologi", "Pendidikan", "Kesehatan",
        "Otomotif", "Properti", "Pariwisata", "Perdagangan", "Industri Kreatif"
    ]

    kuliner_names = [
        "Warung Makan", "Kedai Kopi", "Toko Roti", "Catering", "Resto",
        "Bakso", "Soto", "Nasi Goreng", "Ayam Geprek", "Martabak"
    ]

    fashion_names = [
        "Butik", "Konveksi", "Toko Baju", "Fashion Store", "Tailor",
        "Distro", "Hijab Store", "Sepatu", "Tas", "Aksesoris"
    ]

    kerajinan_names = [
        "Kerajinan", "Handicraft", "Souvenir", "Decor", "Furniture",
        "Anyaman", "Batik", "Ukiran", "Lukisan", "Patung"
    ]

    umkm_list = []

    for i in range(count):
        business_type = random.choice(business_types)

        if business_type == "Kuliner":
            base_name = random.choice(kuliner_names)
        elif business_type == "Fashion":
            base_name = random.choice(fashion_names)
        elif business_type == "Kerajinan Tangan":
            base_name = random.choice(kerajinan_names)
        else:
            base_name = business_type

        business_name = f"{base_name} {fake.city()}"

        umkm = UMKM(
            owner_id=random.choice(users).id,
            business_name=business_name,
            business_type=business_type,
            description=fake.text(max_nb_chars=200),
            address=fake.address(),
            phone=fake.phone_number(),
            email=fake.email() if random.choice([True, False]) else None,
            established_year=random.randint(2010, 2024),
            employee_count=random.randint(1, 50),
            monthly_revenue=round(random.uniform(5000000, 100000000), 2)
        )

        db.add(umkm)
        umkm_list.append(umkm)
        print(f"✓ Created UMKM {i+1}/{count}: {umkm.business_name}")

    db.commit()
    print(f"\n✅ Successfully created {count} UMKM businesses!")
    return umkm_list


def generate_products(db, umkm_list, count_per_umkm=10):
    print(f"\nGenerating products for each UMKM...")

    product_categories = {
        "Kuliner": ["Makanan Berat", "Makanan Ringan", "Minuman", "Kue & Roti", "Jajanan"],
        "Fashion": ["Pakaian Pria", "Pakaian Wanita", "Aksesoris", "Sepatu & Sandal"],
        "Kerajinan Tangan": ["Dekorasi Rumah", "Souvenir", "Furniture", "Kerajinan"],
    }

    # Produk kuliner khas Indonesia & umum
    kuliner_products = {
        "Makanan Berat": [
            ("Nasi Goreng Spesial", 15000, 25000, "porsi"),
            ("Mie Ayam", 12000, 18000, "porsi"),
            ("Bakso Sapi", 15000, 20000, "porsi"),
            ("Soto Ayam", 12000, 18000, "porsi"),
            ("Nasi Uduk", 10000, 15000, "porsi"),
            ("Nasi Pecel", 8000, 12000, "porsi"),
            ("Ayam Geprek", 15000, 25000, "porsi"),
            ("Pecel Lele", 12000, 20000, "porsi"),
            ("Nasi Kuning", 10000, 15000, "porsi"),
            ("Rawon", 18000, 25000, "porsi"),
        ],
        "Makanan Ringan": [
            ("Risol Mayo", 3000, 5000, "pcs"),
            ("Lemper Ayam", 3000, 5000, "pcs"),
            ("Pastel", 3000, 5000, "pcs"),
            ("Tahu Isi", 2000, 3000, "pcs"),
            ("Cireng", 1000, 2000, "pcs"),
            ("Batagor", 15000, 20000, "porsi"),
            ("Siomay", 12000, 18000, "porsi"),
            ("Lumpia Basah", 3000, 5000, "pcs"),
            ("Pisang Goreng", 2000, 3000, "pcs"),
            ("Tempe Mendoan", 1000, 2000, "pcs"),
        ],
        "Minuman": [
            ("Es Teh Manis", 3000, 5000, "gelas"),
            ("Es Jeruk", 5000, 8000, "gelas"),
            ("Kopi Hitam", 5000, 10000, "gelas"),
            ("Kopi Susu", 8000, 15000, "gelas"),
            ("Es Kelapa Muda", 10000, 15000, "gelas"),
            ("Jus Alpukat", 10000, 15000, "gelas"),
            ("Es Campur", 12000, 18000, "porsi"),
            ("Wedang Jahe", 5000, 8000, "gelas"),
            ("Teh Tarik", 8000, 12000, "gelas"),
            ("Es Dawet", 5000, 10000, "gelas"),
        ],
        "Kue & Roti": [
            ("Roti Bakar", 8000, 15000, "pcs"),
            ("Kue Cubit", 1000, 2000, "pcs"),
            ("Martabak Manis", 25000, 50000, "loyang"),
            ("Martabak Telur", 15000, 30000, "pcs"),
            ("Kue Lapis", 25000, 40000, "loyang"),
            ("Brownies Kukus", 30000, 50000, "loyang"),
            ("Bolu Kukus", 20000, 35000, "loyang"),
            ("Donat", 3000, 5000, "pcs"),
            ("Onde-onde", 2000, 3000, "pcs"),
            ("Kue Lumpur", 2000, 4000, "pcs"),
        ],
        "Jajanan": [
            ("Kerupuk Udang", 10000, 20000, "pack"),
            ("Keripik Singkong", 8000, 15000, "pack"),
            ("Keripik Tempe", 8000, 12000, "pack"),
            ("Rempeyek Kacang", 10000, 15000, "pack"),
            ("Emping Melinjo", 15000, 25000, "pack"),
            ("Kue Kering Nastar", 40000, 60000, "toples"),
            ("Kue Kering Kastengel", 45000, 70000, "toples"),
            ("Sale Pisang", 15000, 25000, "pack"),
            ("Dodol", 10000, 20000, "pack"),
            ("Wajik", 5000, 10000, "pcs"),
        ]
    }

    # Produk fashion khas UMKM Indonesia
    fashion_products = {
        "Pakaian Pria": [
            ("Kemeja Batik Pria", 80000, 150000, "pcs"),
            ("Kaos Polos", 30000, 50000, "pcs"),
            ("Kaos Sablon", 40000, 70000, "pcs"),
            ("Celana Jeans", 80000, 150000, "pcs"),
            ("Celana Chino", 70000, 120000, "pcs"),
            ("Koko", 60000, 120000, "pcs"),
            ("Sarung", 50000, 100000, "pcs"),
            ("Jaket Parasut", 80000, 150000, "pcs"),
        ],
        "Pakaian Wanita": [
            ("Gamis", 100000, 200000, "pcs"),
            ("Tunik", 70000, 120000, "pcs"),
            ("Kebaya", 150000, 300000, "pcs"),
            ("Mukena", 80000, 150000, "set"),
            ("Hijab Segi Empat", 20000, 50000, "pcs"),
            ("Pashmina", 25000, 60000, "pcs"),
            ("Dress Batik", 100000, 200000, "pcs"),
            ("Rok Plisket", 50000, 100000, "pcs"),
            ("Dalaman Gamis", 30000, 50000, "pcs"),
        ],
        "Aksesoris": [
            ("Bros Hijab", 10000, 30000, "pcs"),
            ("Kalung", 15000, 50000, "pcs"),
            ("Gelang", 10000, 40000, "pcs"),
            ("Anting", 10000, 35000, "pcs"),
            ("Cincin", 15000, 50000, "pcs"),
            ("Ikat Pinggang", 25000, 60000, "pcs"),
            ("Dompet Wanita", 30000, 80000, "pcs"),
            ("Tas Selempang", 50000, 120000, "pcs"),
        ],
        "Sepatu & Sandal": [
            ("Sandal Jepit", 15000, 30000, "pcs"),
            ("Sandal Gunung", 40000, 80000, "pcs"),
            ("Sepatu Sneakers", 100000, 250000, "pcs"),
            ("Sepatu Pantofel", 150000, 300000, "pcs"),
            ("Sandal Wedges", 60000, 120000, "pcs"),
            ("Flatshoes", 50000, 100000, "pcs"),
        ],
    }

    # Produk kerajinan tangan
    kerajinan_products = {
        "Dekorasi Rumah": [
            ("Vas Bunga Keramik", 25000, 75000, "pcs"),
            ("Lukisan Kanvas", 50000, 200000, "pcs"),
            ("Lampu Hias Rotan", 75000, 150000, "pcs"),
            ("Hiasan Dinding", 30000, 100000, "pcs"),
            ("Kaligrafi Kayu", 50000, 150000, "pcs"),
            ("Pigura Foto", 15000, 50000, "pcs"),
            ("Bunga Artificial", 30000, 80000, "pcs"),
        ],
        "Souvenir": [
            ("Gantungan Kunci", 3000, 10000, "pcs"),
            ("Gelas Sablon", 10000, 25000, "pcs"),
            ("Mug Custom", 15000, 35000, "pcs"),
            ("Boneka Flanel", 15000, 40000, "pcs"),
            ("Tas Souvenir", 10000, 30000, "pcs"),
            ("Pin & Stiker", 2000, 8000, "pcs"),
            ("Tempat Pensil", 8000, 20000, "pcs"),
        ],
        "Furniture": [
            ("Rak Minimalis", 100000, 300000, "pcs"),
            ("Meja Lipat", 150000, 350000, "pcs"),
            ("Kursi Kayu", 100000, 250000, "pcs"),
            ("Lemari Kecil", 200000, 500000, "pcs"),
            ("Rak Sepatu", 80000, 200000, "pcs"),
            ("Bangku Kecil", 50000, 120000, "pcs"),
        ],
        "Kerajinan": [
            ("Tas Anyaman", 40000, 100000, "pcs"),
            ("Keranjang Rotan", 30000, 80000, "pcs"),
            ("Tempat Tisu", 15000, 40000, "pcs"),
            ("Kotak Perhiasan", 25000, 70000, "pcs"),
            ("Alas Piring Mendong", 20000, 50000, "set"),
        ],
    }

    products = []
    total_count = 0

    for umkm in umkm_list:
        if umkm.business_type == "Kuliner":
            # Pilih random kategori kuliner untuk UMKM ini
            categories = list(kuliner_products.keys())
            selected_categories = random.sample(categories, random.randint(2, min(3, len(categories))))

            num_products = random.randint(8, count_per_umkm)
            for i in range(num_products):
                category = random.choice(selected_categories)
                product_data = random.choice(kuliner_products[category])
                product_name, min_price, max_price, unit = product_data

                sku = f"SKU-{umkm.id}-{i+1:03d}"

                product = Product(
                    umkm_id=umkm.id,
                    name=product_name,
                    description=f"{product_name} khas {umkm.business_name}",
                    category=category,
                    price=random.randint(min_price, max_price),
                    stock=random.randint(20, 200),
                    unit=unit,
                    sku=sku,
                    is_active=random.choice([True, True, True, True, False])
                )

                db.add(product)
                products.append(product)
                total_count += 1

        elif umkm.business_type == "Fashion":
            # Pilih random kategori fashion untuk UMKM ini
            categories = list(fashion_products.keys())
            selected_categories = random.sample(categories, random.randint(2, min(3, len(categories))))

            num_products = random.randint(8, count_per_umkm)
            for i in range(num_products):
                category = random.choice(selected_categories)
                product_data = random.choice(fashion_products[category])
                product_name, min_price, max_price, unit = product_data

                sku = f"SKU-{umkm.id}-{i+1:03d}"

                product = Product(
                    umkm_id=umkm.id,
                    name=product_name,
                    description=f"{product_name} berkualitas dari {umkm.business_name}",
                    category=category,
                    price=random.randint(min_price, max_price),
                    stock=random.randint(10, 100),
                    unit=unit,
                    sku=sku,
                    is_active=random.choice([True, True, True, True, False])
                )

                db.add(product)
                products.append(product)
                total_count += 1

        elif umkm.business_type == "Kerajinan Tangan":
            # Pilih random kategori kerajinan untuk UMKM ini
            categories = list(kerajinan_products.keys())
            selected_categories = random.sample(categories, random.randint(2, min(3, len(categories))))

            num_products = random.randint(6, count_per_umkm)
            for i in range(num_products):
                category = random.choice(selected_categories)
                product_data = random.choice(kerajinan_products[category])
                product_name, min_price, max_price, unit = product_data

                sku = f"SKU-{umkm.id}-{i+1:03d}"

                product = Product(
                    umkm_id=umkm.id,
                    name=product_name,
                    description=f"{product_name} handmade dari {umkm.business_name}",
                    category=category,
                    price=random.randint(min_price, max_price),
                    stock=random.randint(5, 50),
                    unit=unit,
                    sku=sku,
                    is_active=random.choice([True, True, True, True, False])
                )

                db.add(product)
                products.append(product)
                total_count += 1

        else:
            # Untuk business type lainnya (Jasa, Pertanian, Perikanan, dll)
            other_products = {
                "Jasa": [
                    ("Jasa Servis Elektronik", 50000, 150000, "jasa"),
                    ("Jasa Reparasi HP", 30000, 100000, "jasa"),
                    ("Jasa Desain Grafis", 50000, 200000, "jasa"),
                    ("Jasa Fotografi", 200000, 500000, "paket"),
                    ("Jasa Cuci Motor", 10000, 20000, "jasa"),
                    ("Jasa Potong Rambut", 15000, 35000, "jasa"),
                ],
                "Pertanian": [
                    ("Beras Premium", 12000, 15000, "kg"),
                    ("Cabai Merah", 30000, 50000, "kg"),
                    ("Tomat Segar", 8000, 12000, "kg"),
                    ("Sayur Kangkung", 3000, 5000, "ikat"),
                    ("Jagung Manis", 5000, 8000, "kg"),
                    ("Bawang Merah", 25000, 40000, "kg"),
                ],
                "Perikanan": [
                    ("Ikan Lele Segar", 20000, 30000, "kg"),
                    ("Ikan Nila", 25000, 35000, "kg"),
                    ("Udang Segar", 60000, 90000, "kg"),
                    ("Ikan Gurame", 40000, 60000, "kg"),
                    ("Ikan Mas", 30000, 45000, "kg"),
                ],
                "Peternakan": [
                    ("Telur Ayam Kampung", 2500, 3500, "butir"),
                    ("Ayam Potong", 30000, 40000, "kg"),
                    ("Daging Sapi", 120000, 150000, "kg"),
                    ("Susu Segar", 8000, 12000, "liter"),
                    ("Telur Bebek", 3000, 4000, "butir"),
                ],
                "Default": [
                    ("Alat Tulis Kantor", 10000, 50000, "pcs"),
                    ("Sabun Cuci", 5000, 15000, "pcs"),
                    ("Deterjen", 8000, 25000, "pack"),
                    ("Minyak Goreng", 15000, 25000, "liter"),
                    ("Gula Pasir", 12000, 15000, "kg"),
                    ("Teh Celup", 5000, 10000, "pack"),
                    ("Kopi Sachet", 1000, 2000, "sachet"),
                ]
            }

            # Pilih produk berdasarkan business type
            business_type = umkm.business_type
            if business_type in other_products:
                product_list = other_products[business_type]
            else:
                product_list = other_products["Default"]

            num_products = random.randint(5, 8)
            for i in range(num_products):
                product_data = random.choice(product_list)
                product_name, min_price, max_price, unit = product_data
                sku = f"SKU-{umkm.id}-{i+1:03d}"

                product = Product(
                    umkm_id=umkm.id,
                    name=product_name,
                    description=f"{product_name} dari {umkm.business_name}",
                    category=business_type,
                    price=random.randint(min_price, max_price),
                    stock=random.randint(10, 100) if unit != "jasa" else 0,
                    unit=unit,
                    sku=sku,
                    is_active=random.choice([True, True, True, True, False])
                )

                db.add(product)
                products.append(product)
                total_count += 1

        if total_count % 50 == 0:
            print(f"✓ Generated {total_count} products...")

    db.commit()
    print(f"\n✅ Successfully created {total_count} products!")
    return products


def generate_customers(db, umkm_list, count_per_umkm=5):
    print(f"\nGenerating customers for each UMKM...")

    customers = []
    total_count = 0

    for umkm in umkm_list:
        num_customers = random.randint(3, count_per_umkm)

        for _ in range(num_customers):
            customer = Customer(
                umkm_id=umkm.id,
                name=fake.name(),
                phone=fake.phone_number()
            )

            db.add(customer)
            customers.append(customer)
            total_count += 1

    db.commit()
    print(f"\n✅ Successfully created {total_count} customers!")
    return customers


def generate_transactions(db, umkm_list, users, products, customers, count_per_umkm=10):
    print(f"\nGenerating transactions for each UMKM...")

    transactions = []
    total_count = 0

    for umkm in umkm_list:
        umkm_products = [p for p in products if p.umkm_id == umkm.id and p.is_active]
        umkm_customers = [c for c in customers if c.umkm_id == umkm.id]

        if not umkm_products:
            continue

        num_transactions = random.randint(5, count_per_umkm)

        for i in range(num_transactions):
            transaction_date = datetime.now() - timedelta(days=random.randint(0, 90))
            transaction_number = f"TRX-{umkm.id}-{transaction_date.strftime('%Y%m%d')}-{i+1:04d}"

            use_customer = random.choice([True, False]) and umkm_customers
            customer = random.choice(umkm_customers) if use_customer else None

            num_items = random.randint(1, min(5, len(umkm_products)))
            selected_products = random.sample(umkm_products, num_items)

            total_amount = 0.0
            items = []

            for prod in selected_products:
                quantity = random.randint(1, 5)
                unit_price = prod.price
                discount = round(random.uniform(0, unit_price * 0.1), -2) if random.random() > 0.7 else 0
                subtotal = (unit_price * quantity) - discount
                total_amount += subtotal

                items.append(TransactionItem(
                    product_id=prod.id,
                    product_name=prod.name,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount=discount,
                    subtotal=subtotal
                ))

            discount_amount = round(random.uniform(0, total_amount * 0.05), -3) if random.random() > 0.8 else 0
            tax_amount = round(total_amount * 0.1, -2) if random.random() > 0.5 else 0
            final_amount = total_amount - discount_amount + tax_amount

            transaction = Transaction(
                umkm_id=umkm.id,
                transaction_number=transaction_number,
                transaction_date=transaction_date,
                customer_id=customer.id if customer else None,
                customer_name=customer.name if customer else fake.name(),
                transaction_type="sale",
                payment_method=random.choice(["cash", "transfer", "e_wallet", "credit"]),
                total_amount=total_amount,
                discount_amount=discount_amount,
                tax_amount=tax_amount,
                final_amount=final_amount,
                payment_status=random.choice(["paid", "paid", "paid", "pending"]),
                notes=fake.sentence() if random.random() > 0.7 else None,
                created_by=random.choice(users).id,
                items=items
            )

            db.add(transaction)
            transactions.append(transaction)
            total_count += 1

        if total_count % 50 == 0:
            print(f"✓ Generated {total_count} transactions...")

    db.commit()
    print(f"\n✅ Successfully created {total_count} transactions!")
    return transactions


def main():
    print("=" * 60)
    print("GarudaAI UMKM - Database Data Generator")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Create tables
        create_tables()

        # Generate data
        users = generate_users(db, count=20)
        umkm_list = generate_umkm(db, users, count=50)
        products = generate_products(db, umkm_list, count_per_umkm=10)
        customers = generate_customers(db, umkm_list, count_per_umkm=5)
        transactions = generate_transactions(db, umkm_list, users, products, customers, count_per_umkm=10)

        print("\n" + "=" * 60)
        print("Summary:")
        print(f"  Users created: {len(users)}")
        print(f"  UMKM created: {len(umkm_list)}")
        print(f"  Products created: {len(products)}")
        print(f"  Customers created: {len(customers)}")
        print(f"  Transactions created: {len(transactions)}")
        print("=" * 60)
        print("\nTest Accounts:")
        print("  Admin:")
        print("    Email: admin@garudaai.com")
        print("    Password: admin123")
        print("\n  User:")
        print("    Email: user@example.com")
        print("    Password: secret")
        print("=" * 60)
        print("\n✅ Database generated successfully!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
