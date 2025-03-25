<script lang="ts">
    import { tm_trace_to_image, tm_explore, tm_blaze, clearBlazeCache, stopBlazeWorker, isBlazeRunning, wasBlazeManuallyStoppped } from '$lib/tm';
    import { onMount, createEventDispatcher, onDestroy } from 'svelte';
    import { getColorScheme } from '$lib/colorSchemes';
    
    // Create event dispatcher
    const dispatch = createEventDispatcher();
    
    // Define our VisualizationMode enum with proper TypeScript typing
    enum VisualizationMode {
        DEFAULT = 'default',
        EXPLORE = 'explore',
        BLAZE = 'blaze'
    }
    
    // Replace the binary exploreMode prop with visualizationMode
    export let visualizationMode: VisualizationMode = VisualizationMode.DEFAULT;
    export let machine: any;
    export let initial_tape: string;
    export let tapeWidth: number;
    export let nbIter: bigint;
    export let origin_x: number;
    export let showHeadMove: boolean;
    
    export let machineName: string;
    
    // Renamed from xStretch to stretch
    export let stretch: boolean = true;
    
    // New quality parameter for binning control in Blaze mode
    export let quality: boolean = true;
    
    // New dark mode parameter for theme control in Blaze mode
    export let darkMode: boolean = false;
    
    // Track if blaze is currently running
    let isRunning = false;
    
    // Helper functions to simplify conditional checks with proper types
    function isDefaultMode(mode: VisualizationMode): boolean {
        return mode === VisualizationMode.DEFAULT;
    }
    
    function isExploreMode(mode: VisualizationMode): boolean {
        return mode === VisualizationMode.EXPLORE;
    }
    
    function isBlazeMode(mode: VisualizationMode): boolean {
        return mode === VisualizationMode.BLAZE;
    }
    
    // Helper function to check if a parameter should be shown based on visualization mode
    export function shouldShowParameter(mode: VisualizationMode, paramName: string): boolean {
        if (isBlazeMode(mode)) {
            // Blaze mode only shows steps parameter
            return paramName === 'nbIter';
        }
        // Default and Explore modes show all parameters
        return true;
    }
    
    let canvas: HTMLCanvasElement;
    
    const drawRect = (context: CanvasRenderingContext2D): void => {
        // Use the current color scheme's background color
        const colorScheme = getColorScheme(darkMode);
        context.fillStyle = colorScheme.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fill();
    };
    
    // Function to handle the re-run/stop button
    function handleBlazeButton(): void {
        if (isRunning) {
            // If running, stop the worker
            console.log('Stopping blaze visualization');
            const stopped = stopBlazeWorker();
            if (stopped) {
                isRunning = false;
                // Dispatch event to update UI
                dispatch('blazeStateChange', { running: false });
                
                // Update button immediately
                updateBlazeButtonText();
                
                // Find and update the status element manually in case the worker's terminated
                const statusElement = document.getElementById('tm-blaze-status');
                if (statusElement) {
                    const currentText = statusElement.textContent || '';
                    // Replace "Running" with "Stopped" in the status text
                    const updatedText = currentText.replace(/Running/, 'Stopped');
                    statusElement.innerHTML = `<em>${updatedText}</em>`;
                }
            }
        } else {
            // If not running, start a new run
            console.log('Forcing re-run of blaze visualization');
            // Clear the Blaze cache to force a new render
            clearBlazeCache();
            
            // Find and update the status element to immediately show "Running"
            const statusElement = document.getElementById('tm-blaze-status');
            if (statusElement) {
                const currentText = statusElement.textContent || '';
                // Replace "Stopped" with "Running" in the status text
                const updatedText = currentText.replace(/Stopped/, 'Running');
                statusElement.innerHTML = `<em>${updatedText}</em>`;
            }
            
            if (canvas) {
                // Force immediate redraw
                draw();
                dispatch('blazeStateChange', { running: true });
            }
        }
    }
    
    // Setup the re-run/stop button click handler
    function setupBlazeButton() {
        setTimeout(() => {
            const blazeButton = document.getElementById('tm-blaze-rerun');
            if (blazeButton) {
                blazeButton.onclick = handleBlazeButton;
                
                // Update button text based on running state
                updateBlazeButtonText();
            }
        }, 0);
    }
    
    // Function to update button text based on running state
    function updateBlazeButtonText() {
        const blazeButton = document.getElementById('tm-blaze-rerun');
        if (blazeButton) {
            // Get current running state from the TM module
            isRunning = isBlazeRunning();
            
            // Update button text/class based on running state
            if (isRunning) {
                blazeButton.textContent = 'stop';
                blazeButton.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-500');
                blazeButton.classList.add('bg-white', 'text-black', 'border', 'border-gray-300');
            } else {
                blazeButton.textContent = 're-run';
                blazeButton.classList.remove('bg-white', 'text-black', 'border', 'border-gray-300');
                blazeButton.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-500');
            }
        }
    }
    
    // Function to start a timer to update button state
    let buttonStateTimer: number;
    function startButtonStateTimer() {
        // Clear any existing timer
        if (buttonStateTimer) clearInterval(buttonStateTimer);
        
        // Start a new timer to update button state every 200ms
        buttonStateTimer = setInterval(() => {
            updateBlazeButtonText();
        }, 200);
    }
    
    onMount(() => {
        if (isBlazeMode(visualizationMode)) {
            setupBlazeButton();
            startButtonStateTimer();
        }
    });
    
    onDestroy(() => {
        // Clean up timer on component destroy
        if (buttonStateTimer) clearInterval(buttonStateTimer);
    });
    
    // Watch for changes to visualization mode to set up the button when switching to Blaze
    $: if (isBlazeMode(visualizationMode)) {
        setupBlazeButton();
        startButtonStateTimer();
    } else {
        // Clear timer when not in Blaze mode
        if (buttonStateTimer) clearInterval(buttonStateTimer);
    }
    
    // Watch for dark mode changes and force a redraw
    $: if (isBlazeMode(visualizationMode) && machine) {
        // If we're in Blaze mode and darkMode changes, force a redraw
        darkMode; // Add reactive dependency on darkMode
        
        // When darkMode changes, clear the Blaze cache to force a new render with the new colors
        clearBlazeCache();
        
        // Only redraw if canvas exists
        if (canvas) {
            console.log("Dark mode changed, forcing redraw with new colors");
            draw();
        }
    }
    
    // Update the class on the canvas element to reflect dark mode
    $: canvasClass = darkMode 
        ? "bg-black image-render-pixel" 
        : "bg-white image-render-pixel";
    
    let drawCleanup: (() => void) | undefined;
    async function draw(): Promise<void> {
        if (drawCleanup) drawCleanup();
        
        // Update the width of the canvas based on visualization mode
        // Non-default modes use the wider canvas
        canvas.width = isDefaultMode(visualizationMode) ? 400 : 800;
        
        if (!machine) {
            return;
        }
        
        const context = canvas.getContext('2d');
        if (!context) return;
        
        drawRect(context);
        
		// Choose visualization method based on mode
		switch (visualizationMode) {
			case VisualizationMode.EXPLORE:
                const height_explore = Number(nbIter > 99999n ? 99999n : nbIter);
			    drawCleanup = tm_explore(context, machine, initial_tape, height_explore);
			    break;
			
			case VisualizationMode.BLAZE:
				// Pass stretch, quality, and color scheme parameters to tm_blaze
				try {
                    // Track running state before calling tm_blaze
                    isRunning = true;
                    dispatch('blazeStateChange', { running: true });
                    
                    // Update button immediately
                    updateBlazeButtonText();
                    
                    // Get color scheme based on dark mode setting
                    const colorScheme = getColorScheme(darkMode);
                    
                    await tm_blaze(
                        context, 
                        machine, 
                        nbIter, 
                        stretch, 
                        quality, 
                        colorScheme.background, 
                        colorScheme.foreground
                    ).catch(error => {
                        console.error("Error in blaze visualization:", error);
                    });
                    
                    // Update running state after tm_blaze completes
                    isRunning = false;
                    dispatch('blazeStateChange', { running: false });
                    
                    // Update button after completion
                    updateBlazeButtonText();
                } catch (error) {
                    console.error("Error in blaze visualization:", error);
                    isRunning = false;
                    dispatch('blazeStateChange', { running: false });
                    updateBlazeButtonText();
                }
                break;
			
			case VisualizationMode.DEFAULT:
			default:
			    // Default mode
                const height_default = Number(nbIter > 99999n ? 99999n : nbIter);
			    tm_trace_to_image(
				    context,
				    machine,
				    initial_tape,
				    tapeWidth,
				    height_default,
				    origin_x,
				    true,
				    showHeadMove
			    );
			    break;
		}
    }
    
    $: {
        // Dependencies:
        visualizationMode;
        machine;
        initial_tape;
        tapeWidth;
        nbIter;
        origin_x;
        showHeadMove;
        stretch; // Renamed from xStretch
        quality; // Add new dependency
        darkMode; // Add new dark mode dependency (no actual effect yet)
        
        if (canvas) {
            draw();
        }
    }
</script>

<div class="relative mr-5">
    <canvas class={canvasClass} bind:this={canvas} width="400" height="500" />
</div>
