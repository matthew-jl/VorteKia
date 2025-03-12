pub mod prelude;
pub mod customer;
pub mod staff;
pub mod restaurant;
pub mod menu_item;
pub mod order_restaurant;
pub mod ride;
pub mod ride_queue;
pub mod store;
pub mod souvenir;
pub mod order_souvenir;

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
