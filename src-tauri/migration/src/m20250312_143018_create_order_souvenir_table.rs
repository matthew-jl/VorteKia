use sea_orm_migration::{prelude::*, schema::*};

use crate::{
    m20250304_152552_create_customer_table::Customer, m20250312_143002_create_store_table::Store, m20250312_143009_create_souvenir_table::Souvenir,
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(OrderSouvenir::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(OrderSouvenir::OrderSouvenirId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(OrderSouvenir::CustomerId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderSouvenir::StoreId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderSouvenir::SouvenirId)
                            .string()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderSouvenir::Quantity)
                            .integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(OrderSouvenir::Timestamp)
                            .timestamp()
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_souvenir-customer_id")
                            .from(OrderSouvenir::Table, OrderSouvenir::CustomerId)
                            .to(Customer::Table, Customer::CustomerId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_souvenir-store_id")
                            .from(OrderSouvenir::Table, OrderSouvenir::StoreId)
                            .to(Store::Table, Store::StoreId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-order_souvenir-souvenir_id")
                            .from(OrderSouvenir::Table, OrderSouvenir::SouvenirId)
                            .to(Souvenir::Table, Souvenir::SouvenirId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(OrderSouvenir::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum OrderSouvenir {
    Table,
    OrderSouvenirId,
    CustomerId,
    StoreId,
    SouvenirId,
    Quantity,
    Timestamp,
}