module custom_coin::custom_coin_a {
  use sui::coin;
  use sui::tx_context::{Self, TxContext};
  use std::option;
  use sui::transfer;
  use sui::object::UID;
  use sui::object;
  use sui::coin::{Coin, TreasuryCap};
  
  struct CUSTOM_COIN_A has drop {}
  
  struct Treasury has key {
    id: UID,
    cap: TreasuryCap<CUSTOM_COIN_A>
  }
  
  struct AdminCap has key {
    id: UID
  }

  fun init(otw: CUSTOM_COIN_A, ctx: &mut TxContext) {
    let decimals = 9;
    let name = b"Custom Coin A";
    let symbol = b"CCA";
    let description = b"Custom Coin A";
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
  
  public fun mint(_: &AdminCap, treasury: &mut Treasury, amount: u64, ctx: &mut TxContext): Coin<CUSTOM_COIN_A> {
    coin::mint(&mut treasury.cap, amount, ctx)
  }
}
