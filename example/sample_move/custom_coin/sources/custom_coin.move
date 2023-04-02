module custom_coin::custom_coin {
  use sui::coin;
  use sui::tx_context::TxContext;
  use std::option;
  use sui::transfer;
  use sui::tx_context;
  use sui::math;

  struct CUSTOM_COIN has drop {}

  fun init(otw: CUSTOM_COIN, ctx: &mut TxContext) {
    let decimals = 9;
    let name = b"Custom Coin";
    let symbol = b"CC";
    let description = b"Custom Coin";
    let icon_url = option::none();
    let (treasuryCap, metaData) = coin::create_currency(otw, decimals, symbol, name, description, icon_url, ctx);
    let sender = tx_context::sender(ctx);
    coin::mint_and_transfer(&mut treasuryCap, 100 * math::pow(10, decimals), sender, ctx);
    transfer::public_transfer(treasuryCap, sender);
    transfer::public_freeze_object(metaData);
  }
}
