<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function onClick(event) {
    dispatch("click", event);
  }
</script>

<style>
  button {
    font-family: var(--ss-font-family);
    outline: none;
    border: var(--ss-border-width) solid rgb(var(--ss-accent));
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    font-weight: 800;
    border-radius: var(--ss-border-radius);
    color: rgb(var(--ss-bg));
    background-color: rgb(var(--ss-accent));
    transition: 0.1s linear;
  }

  button:focus,
  button:active,
  button:hover {
    color: rgb(var(--ss-accent));
    border: var(--ss-border-width) solid rgba(var(--ss-accent));
    background-color: transparent;
  }

  button:active {
    transform: translateY(0.25rem);
  }
</style>

<svelte:options tag="ss-button" />
<button on:click={onClick}>
  <slot />
</button>
