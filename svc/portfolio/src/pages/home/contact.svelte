<script lang="ts">
  import Icon from "svelte-awesome/components/Icon.svelte";
  import {
    faYoutube,
    faTwitter,
    faGithub,
    faLinkedin,
    faInstagram,
    faUnsplash,
  } from "@fortawesome/free-brands-svg-icons";
  import { faEnvelopeOpen } from "@fortawesome/free-regular-svg-icons";

  import { PfCard, PfHeader } from "@propfull/kit";
  export let theme;
</script>

<section class="contact">
  <div>
    <h2>contact</h2>
    <p>
      Here's how you can get in touch with me - links to all contact. Most
      active on Github and Instagram; but you can send a quick email, or a pull
      request, or a direct message or a tweet... 😂
    </p>
  </div>
  <div class="social-links">
    <!-- <div class="social-links"> -->
    <a class="social-link-anchor" href="mailto:mrsauravsahu@outlook.com">
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">email</PfHeader>
          <Icon data={faEnvelopeOpen} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a
      class="social-link-anchor"
      href="https://youtube.com/channel/UCPWETNZS6Cu3X2fYnpME32g"
    >
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">youtube</PfHeader>
          <Icon data={faYoutube} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a class="social-link-anchor" href="https://instagram.com/photosbysaurav">
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">instagram</PfHeader>
          <Icon data={faInstagram} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a class="social-link-anchor" href="https://twitter.com/mrsauravsahu">
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">twitter</PfHeader>
          <Icon data={faTwitter} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a class="social-link-anchor" href="https://github.com/mrsauravsahu">
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">github</PfHeader>
          <Icon data={faGithub} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a
      class="social-link-anchor"
      href="https://www.linkedin.com/in/mrsauravsahu"
    >
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">linkedIn</PfHeader>
          <Icon data={faLinkedin} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <a class="social-link-anchor" href="https://unsplash.com/mrsauravsahu">
      <PfCard {theme}>
        <div slot="content" class="social-card-content">
          <PfHeader theme="dark" type="h2">unsplash</PfHeader>
          <Icon data={faUnsplash} scale={2.5} />
        </div>
      </PfCard>
    </a>
    <!-- </div> -->
  </div>
</section>

<style>
  .contact {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .social-links {
    display: flex;
    flex-direction: row;
    /* flex-ite */
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .social-link-anchor {
    all: unset;
    width: 100%;
    cursor: pointer;
    margin: 1rem 0;
    min-height: 8rem;
    margin: 0.25rem;
  }

  .social-card-content {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }

  @media (min-width: 48rem) {
    .social-link-anchor {
      width: calc(25% - 1rem);
      height: 8rem;
    }

    .contact {
      margin: 1rem 4rem;
    }
  }
</style>
