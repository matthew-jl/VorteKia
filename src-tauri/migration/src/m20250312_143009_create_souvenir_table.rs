use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250312_143002_create_store_table::Store;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Souvenir::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Souvenir::SouvenirId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Souvenir::Name).string().not_null())
                    .col(ColumnDef::new(Souvenir::Photo).string())
                    .col(ColumnDef::new(Souvenir::Price).decimal().not_null())
                    .col(ColumnDef::new(Souvenir::Stock).integer().not_null())
                    .col(ColumnDef::new(Souvenir::StoreId).string().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-souvenir-store_id")
                            .from(Souvenir::Table, Souvenir::StoreId)
                            .to(Store::Table, Store::StoreId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Souvenir::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Souvenir {
    Table,
    SouvenirId,
    Name,
    Photo,
    Price,
    Stock,
    StoreId,
}