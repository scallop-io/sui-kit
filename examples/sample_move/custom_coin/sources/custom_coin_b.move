module custom_coin::custom_coin_b {
  use sui::coin;
  use sui::tx_context::TxContext;
  use std::option;
  use sui::transfer;
  use sui::object::UID;
  use sui::object;
  use sui::coin::{Coin, TreasuryCap};
  use sui::tx_context;
  
  struct CUSTOM_COIN_B has drop {}
  
  struct Treasury has key {
    id: UID,
    cap: TreasuryCap<CUSTOM_COIN_B>
  }
  
  struct AdminCap has key {
    id: UID,
  }
  
  struct Loan {
    value: u64
  }
  
  fun init(otw: CUSTOM_COIN_B, ctx: &mut TxContext) {
    let decimals = 9;
    let name = b"Custom Coin B";
    let symbol = b"CCB";
    let description = b"Custom Coin B";
    let icon_url = option::none();
    let (treasuryCap, metaData) = coin::create_currency(otw, decimals, symbol, name, description, icon_url, ctx);
    let treasury = Treasury {
      id: object::new(ctx),
      cap: treasuryCap
    };
    transfer::share_object(treasury);
    transfer::public_freeze_object(metaData);
    transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
  }
  
  public fun mint(_: &AdminCap, treasury: &mut Treasury, amount: u64, ctx: &mut TxContext): Coin<CUSTOM_COIN_B> {
    coin::mint(&mut treasury.cap, amount, ctx)
  }
  
  public fun flash_loan(treasury: &mut Treasury, amount: u64, ctx: &mut TxContext): (Coin<CUSTOM_COIN_B>, Loan) {
    let coin = coin::mint(&mut treasury.cap, amount, ctx);
    return (coin, Loan { value: amount })
  }
  
  public fun payback_loan(treasury: &mut Treasury, coin: Coin<CUSTOM_COIN_B>, loan: Loan) {
    let Loan { value } = loan;
    assert!(coin::value(&coin) == value, 0);
    coin::burn(&mut treasury.cap, coin);
  }
}
