<template>
  <UApp>
    <div class="min-h-screen bg-muted/40">
      <header class="border-b border-default bg-default">
        <nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          <strong>form-kit playground</strong>
          <NuxtLink to="/" class="hover:underline">
            ทุกชนิดฟิลด์
          </NuxtLink>
          <NuxtLink to="/edit" class="hover:underline">
            Edit / View / Server errors
          </NuxtLink>
          <NuxtLink to="/custom" class="hover:underline">
            Custom field + JSON schema
          </NuxtLink>
        </nav>
      </header>
      <main class="mx-auto max-w-5xl px-4 py-6">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
