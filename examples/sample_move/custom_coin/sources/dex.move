module custom_coin::dex {
  
  use sui::object::UID;
  use custom_coin::custom_coin_a::CUSTOM_COIN_A;
  use custom_coin::custom_coin_b::CUSTOM_COIN_B;
  use sui::balance::{Self, Balance};
  use sui::coin::{Self, Coin};
  use sui::tx_context::TxContext;
  use sui::transfer;
  use sui::object;
  
  
  struct Pool has key {
    id: UID,
    balance_a: Balance<CUSTOM_COIN_A>,
    balance_b: Balance<CUSTOM_COIN_B>,
  }
  
  fun init(ctx: &mut TxContext) {
    transfer::share_object(
      Pool {
        id: object::new(ctx),
        balance_a: balance::zero(),
        balance_b: balance::zero(),
      }
    );
  }
  
  // b -> a ratio: 1:1
  public fun swap_a(pool: &mut Pool, coin_b: Coin<CUSTOM_COIN_B>, ctx: &mut TxContext): Coin<CUSTOM_COIN_A> {
    let coin_b_amount = coin::value(&coin_b);
    balance::join(
      &mut pool.balance_b,
      coin::into_balance(coin_b)
    );
    coin::from_balance(
      balance::split(&mut pool.balance_a, coin_b_amount),
      ctx
    )
  }
  
  // a -> b ratio: 1:2
  public fun swap_b(pool: &mut Pool, coin_a: Coin<CUSTOM_COIN_A>, ctx: &mut TxContext): Coin<CUSTOM_COIN_B> {
    let coin_a_amount = coin::value(&coin_a);
    balance::join(
      &mut pool.balance_a,
      coin::into_balance(coin_a)
    );
    coin::from_balance(
      balance::split(&mut pool.balance_b, 2 * coin_a_amount),
      ctx
    )
  }
  
  public entry fun top_up(
    pool: &mut Pool,
    coin_a: Coin<CUSTOM_COIN_A>,
    coin_b: Coin<CUSTOM_COIN_B>,
  ) {
    balance::join(&mut pool.balance_a, coin::into_balance(coin_a));
    balance::join(&mut pool.balance_b, coin::into_balance(coin_b));
  }
}
