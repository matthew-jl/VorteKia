// src-tauri/src/migrations/mYYYYMMDD_HHMMSS_create_message_table.rs
//  (replace YYYYMMDD_HHMMSS with the current date and time)

use sea_orm_migration::{prelude::*, schema::*};

use crate::m20250320_151149_create_chat_table::Chat; // Replace with your actual chat migration file name

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Message::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Message::MessageId)
                            .string()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Message::ChatId).string().not_null())
                    .col(ColumnDef::new(Message::SenderId).string().not_null())
                    .col(ColumnDef::new(Message::Text).text().not_null())
                    .col(
                        ColumnDef::new(Message::Timestamp)
                            .timestamp()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-message-chat_id")
                            .from(Message::Table, Message::ChatId)
                            .to(Chat::Table, Chat::ChatId)
                            .on_delete(ForeignKeyAction::Cascade), // Or use Restrict
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Message::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
pub enum Message {
    Table,
    MessageId,
    ChatId,
    SenderId,
    Text,
    Timestamp,
}