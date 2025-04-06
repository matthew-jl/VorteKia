// src-tauri/src/migrations/mYYYYMMDD_HHMMSS_create_chat_table.rs
//  (replace YYYYMMDD_HHMMSS with the current date and time)

use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Chat::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Chat::ChatId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Chat::Name).string().not_null())
                    .col(ColumnDef::new(Chat::LastMessageText).text())
                    .col(ColumnDef::new(Chat::LastMessageTimestamp).timestamp())
                    .col(
                        ColumnDef::new(Chat::CreatedAt)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Chat::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Chat {
    Table,
    ChatId,
    Name,
    LastMessageText,
    LastMessageTimestamp,
    CreatedAt,
}