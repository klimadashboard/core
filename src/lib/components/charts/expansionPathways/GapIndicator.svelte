<script>
    export let gap;
</script>

<div>
    <div class="flex items-end gap-4">
    <span class="text-8xl font-extralight translate-y-2">
        {gap.gap}
    </span>
    {@html gap.icon}
    </div>
    <p class="mt-2">{gap.text}</p>
</div>