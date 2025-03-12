use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Store::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Store::StoreId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Store::Name).string().not_null())
                    .col(ColumnDef::new(Store::Photo).string())
                    .col(ColumnDef::new(Store::OpeningTime).time().not_null())
                    .col(ColumnDef::new(Store::ClosingTime).time().not_null())
                    .col(ColumnDef::new(Store::Location).string())
                    .col(ColumnDef::new(Store::Status).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Store::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Store {
    Table,
    StoreId,
    Name,
    Photo,
    OpeningTime,
    ClosingTime,
    Location,
    Status,
}