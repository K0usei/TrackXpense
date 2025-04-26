import asyncio
from prisma import Prisma

async def main():
    # Initialize Prisma client
    db = Prisma()
    await db.connect()

    try:
        # Create categories
        categories = [
            {"name": "Food"},
            {"name": "Transportation"},
            {"name": "Housing"},
            {"name": "Utilities"},
            {"name": "Entertainment"},
            {"name": "Healthcare"},
            {"name": "Shopping"},
            {"name": "Others"},
        ]

        for category in categories:
            # Check if category exists
            existing_category = await db.category.find_first(
                where={"name": category["name"]}
            )
            
            # If not, create it
            if not existing_category:
                await db.category.create(data=category)
                print(f"Created category: {category['name']}")
            else:
                print(f"Category already exists: {category['name']}")

        print("Database seeded successfully")
    
    finally:
        # Disconnect from the database
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
