<script lang="ts">
  // "Your nation": pick or drop a nation profile file and see which sections are filled, each
  // with a link to its tool. The file is read on this device and forgotten when the page
  // closes: nothing is sent and nothing is stored.
  //
  // No hints: this component knows only the sections the build hands it, which are the ones
  // whose tools are live. Anything else in the file is counted, never named.
  import { copyText, toast } from '@eurth/style';
  import Icon from '@eurth/style/components/Icon.svelte';
  import { faCircleCheck, faCopy, faFolderOpen, faIdCard, faMinus, faXmark } from '@fortawesome/free-solid-svg-icons';
  import { NATION } from '../content/copy.js';
  import { checkFile, describeNation, moreLine, readProfile, type LiveSection, type Nation } from '../hub/nation.js';

  interface Props {
    /** The sections whose tools are live, from the build. */
    sections: LiveSection[];
    /** This site's host, for ?ref= on links to the tools. */
    host: string;
    /** Every door of the calendar is open. */
    allOpen: boolean;
    /** "Open the card", once the tool that makes it is live. */
    card?: { button: string; href: string; note: string } | undefined;
  }
  let { sections, host, allOpen, card }: Props = $props();

  // A profile is replaced, never changed in place.
  let nation = $state.raw<Nation | null>(null);
  let problem = $state('');
  let over = $state(false);
  let picker = $state<HTMLInputElement>();

  const total = $derived(nation ? nation.filled.length + nation.empty.length : 0);
  const more = $derived(nation ? moreLine(nation.more, allOpen) : '');

  async function take(file: File | undefined | null) {
    if (!file) return;
    const refused = checkFile(file);
    if (refused) {
      nation = null;
      problem = refused;
      return;
    }
    let text = '';
    try {
      text = await file.text();
    } catch {
      nation = null;
      problem = "That file couldn't be read. Try picking it again.";
      return;
    }
    const result = readProfile(text, sections, host);
    if (result.ok) {
      nation = result.nation;
      problem = '';
      toast(NATION.welcome(result.nation.name));
    } else {
      nation = null;
      problem = result.message;
    }
  }

  function forget() {
    nation = null;
    problem = '';
    if (picker) picker.value = '';
    toast(NATION.forgotten);
  }

  async function copy() {
    if (!nation) return;
    toast((await copyText(describeNation(nation, allOpen))) ? NATION.copied : "Copying isn't allowed here. Select the text instead.");
  }

  const carriesFile = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files');

  function dragover(event: DragEvent) {
    if (!carriesFile(event)) return;
    event.preventDefault();
    over = true;
  }

  function drop(event: DragEvent) {
    if (!carriesFile(event)) return;
    event.preventDefault();
    over = false;
    void take(event.dataTransfer?.files[0]);
  }
</script>

<svelte:window ondragover={dragover} ondragleave={() => (over = false)} ondrop={drop} />

<div class="nation eu-stack" class:nation--over={over}>
  <div class="eu-row nation-controls">
    <input bind:this={picker} id="nation-file" class="eu-visually-hidden" type="file" accept=".json,application/json" onchange={(event) => take(event.currentTarget.files?.[0])} />
    <button class="eu-btn eu-btn--primary" type="button" data-click="bounce" onclick={() => picker?.click()}>
      <Icon icon={faFolderOpen} />
      {NATION.load}
    </button>
    {#if card}
      <a class="eu-btn" href={card.href} data-same-tab>
        <Icon icon={faIdCard} />
        {card.button}
      </a>
    {/if}
  </div>
  <p class="eu-help nation-controls">{over ? NATION.dropping : NATION.drop}</p>

  {#if problem}
    <p class="eu-error" role="alert">{problem}</p>
  {/if}

  {#if nation}
    <div class="eu-stack" role="status">
      <h3>{NATION.result(nation.name, nation.filled.length, total)}</h3>
      <ul class="nation-list">
        {#each nation.filled as section (section.section)}
          <li>
            <span class="nation-mark nation-mark--filled"><Icon icon={faCircleCheck} /> {NATION.filled}</span>
            <span class="nation-what">
              <strong>{section.label}</strong>
              {#if section.summary}<span class="nation-summary">{section.summary}</span>{/if}
              {#if section.href && section.toolName}<a href={section.href} data-same-tab>{NATION.open(section.toolName)}</a>{/if}
            </span>
          </li>
        {/each}
        {#each nation.empty as section (section.section)}
          <li>
            <span class="nation-mark"><Icon icon={faMinus} /> {NATION.notYet}</span>
            <span class="nation-what">
              <strong>{section.label}</strong>
              {#if section.href && section.toolName}<a href={section.href} data-same-tab>{NATION.make(section.toolName)}</a>{/if}
            </span>
          </li>
        {/each}
      </ul>
      {#if more}<p class="eu-muted">{more}</p>{/if}
      {#if card}<p class="eu-help">{card.note}</p>{/if}
      <div class="eu-row">
        <button class="eu-btn" type="button" data-click="pop" onclick={copy}>
          <Icon icon={faCopy} />
          {NATION.copy}
        </button>
        <button class="eu-btn eu-btn--quiet" type="button" onclick={forget}>
          <Icon icon={faXmark} />
          {NATION.forget}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .nation--over {
    outline: var(--size-ring) dashed var(--accent-text);
    outline-offset: var(--space-2);
    border-radius: var(--radius-md);
  }

  .nation p,
  .nation h3 {
    margin: 0;
  }

  .nation-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .nation-list li {
    display: grid;
    grid-template-columns: calc(var(--space-16) * 1.5) 1fr;
    gap: var(--space-3);
    align-items: baseline;
  }

  .nation-mark {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--ink-muted);
    font: var(--type-label);
  }

  .nation-mark--filled {
    color: var(--success-text);
  }

  .nation-what {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .nation-what a {
    align-self: flex-start;
    /* A link on a line of its own is a target, so it gets a target's height. */
    display: inline-flex;
    align-items: center;
    min-height: var(--size-target);
  }

  .nation-summary {
    color: var(--ink-muted);
    font: var(--type-body-sm);
    overflow-wrap: anywhere;
  }

  /* Without JavaScript the buttons can do nothing, so they step aside for the note beside them. */
  @media (scripting: none) {
    .nation-controls {
      display: none;
    }
  }
</style>
