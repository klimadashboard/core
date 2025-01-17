<script>
	import { page } from '$app/stores';
	$: console.log($page);
</script>

<div class="hidden sm:block">
	<ol>
		<li>
			<span class="opacity-50 mr-3">›</span>
			<a href="#">Breadcrumb Menü</a>
		</li>
	</ol>
</div>
