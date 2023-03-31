module package_b::b {
  use package_a::a::{Self, Counter};

  public fun increment(counter: &mut Counter) {
    a::increment_by(counter, 1)
  }
}
