module sample_move::sample {
  use sui::object::{Self, UID};
  use sui::tx_context::TxContext;
  use sui::transfer;

  struct Counter has key {
    id: UID,
    value: u64
  }

  fun init(ctx: &mut TxContext) {
    let counter = Counter {
      id: object::new(ctx),
      value: 0
    };
    transfer::share_object(counter);
  }

  public fun increment(counter: &mut Counter) {
    counter.value = counter.value + 1;
  }

  public fun decrement(counter: &mut Counter) {
    counter.value = counter.value - 1;
  }

  public fun get(counter: &Counter): u64 {
    counter.value
  }
}
