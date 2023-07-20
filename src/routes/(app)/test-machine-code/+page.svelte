<SeoTitle value="test machine code"/>

<script lang="ts">
	import SeoTitle from "$lib/seo_title.svelte";
  //Making sure that encoding of machines is same on server and client
	import { API } from '$lib/api_server';
	import {machineCodeToTM, tmToMachineCode } from '$lib/tm';
  import { onMount } from 'svelte';

  async function getRandomMachine() {
		try {
			const response = await API.post('/machine/random', { type: "all" });

			return response.data['machine_code']
		} catch (error) {
			console.log(error);
		}
	}

  onMount(async () => {
  let nb_tests = 1000;

    for (let i = 0 ; i < nb_tests ; i += 1) {
      let machine_code = await getRandomMachine()
        let machine = machineCodeToTM(machine_code);
        let machine_code_again = tmToMachineCode(machine);
        if (machine_code_again != machine_code) {
          console.log("Problem", machine, machine_code, machine_code_again)
        }
    }
  })

</script>