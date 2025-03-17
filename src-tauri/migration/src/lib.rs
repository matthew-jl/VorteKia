pub use sea_orm_migration::prelude::*;

mod m20250304_152552_create_customer_table;
mod m20250306_032524_create_staff_table;
mod m20250306_111959_create_restaurant_table;
mod m20250306_112015_create_menu_item_table;
mod m20250307_114130_create_ride_table;
mod m20250307_114226_create_ride_queue_table;
mod m20250310_151947_create_order_restaurant_table;
mod m20250312_143002_create_store_table;
mod m20250312_143009_create_souvenir_table;
mod m20250312_143018_create_order_souvenir_table;
mod m20250317_105552_create_lost_and_found_items_log_table;



pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250304_152552_create_customer_table::Migration),
            Box::new(m20250306_032524_create_staff_table::Migration),
            Box::new(m20250306_111959_create_restaurant_table::Migration),
            Box::new(m20250306_112015_create_menu_item_table::Migration),
            Box::new(m20250307_114130_create_ride_table::Migration),
            Box::new(m20250307_114226_create_ride_queue_table::Migration),
            Box::new(m20250310_151947_create_order_restaurant_table::Migration),
            Box::new(m20250312_143002_create_store_table::Migration),
            Box::new(m20250312_143009_create_souvenir_table::Migration),
            Box::new(m20250312_143018_create_order_souvenir_table::Migration),
            Box::new(m20250317_105552_create_lost_and_found_items_log_table::Migration),
        ]
    }
}
