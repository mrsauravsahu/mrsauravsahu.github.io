<script lang="ts">
  import { PfCard, PfHeader } from "@propfull/kit";
  export let projects;
  export let theme;
</script>

<style>
  .projects-container > div {
    margin-bottom: 1rem;
  }

  .cards-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .highlight {
    all: unset;
    width: 100%;
    cursor: pointer;
    margin: 0.5rem 0;
  }

  .title {
    padding: 0;
    font-size: 1.5rem;
  }

  .title,
  .project-content {
    padding: 0 1rem;
  }

  .project-content {
    padding-bottom: 2rem;
  }

  @media (min-width: 48rem) {
    .cards-container > a {
      width: calc(50% - 1rem);
    }
  }

  :global(.title  h2) {
    font-size: 1.5rem;
  }
</style>

<div class="projects-container ss-content">
<PfHeader theme='dark' type='h1'>--highlighted-projects</PfHeader>
  <p>
    First, here are a few of the projects that I'm working on. You can find more
    about them on Github, be sure to give a star if you like it :) I will be
    pinning some important links and combining the contact section here.
  </p>
  <div class="cards-container">
    {#each projects as project}
      <a class="highlight" href={project.url}>
        <PfCard {theme}>
          <div class="title" slot="title">
            <PfHeader type="h2" theme="dark">{project.title}</PfHeader>
          </div>
          <div class="project-content" slot="content">
            {project.description}
          </div>
        </PfCard>
      </a>
    {/each}
  </div>
</div>
