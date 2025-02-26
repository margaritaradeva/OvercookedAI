// -----------------------------------------------------------------------------
// tutorial.js
// -----------------------------------------------------------------------------
// Visit index.js first since some of the functions are similar/same and therefore
// not as extensively commented.
//
// This file drives the "tutorial" flow for new users (on tutorial.html).
// It uses Socket.IO to run a special "tutorial" game mode on the server,
// where the user goes through multiple "phases"/"mechanics."
//
// The client displays instructions/hints and transitions from one phase
// to the next when the server calls "reset_game." Each phase introduces
// a different Overcooked mechanic.
//
// -----------------------------------------------------------------------------

// Create a persistent Socket.IO connection.
var socket = io();

// Parse a config from the HTML (#config) that defines tutorial parameters
var config;

// tutorial_instructions() / tutorial_hints() are functions that return arrays of
// text instructions/hints for each phase.
var tutorial_instructions = () => [
    `
    <p>Mechanic: <b>Delivery</b></p>
    <p>Your goal here is to cook and deliver soups in order to earn reward. Notice how your partner is busily churning out soups</p>
    <p>See if you can copy his actions in order to cook and deliver the appropriate soup</p>
    <p><b>Note</b>: only recipes in the <b>All Orders</b> field will earn reward. Thus, you must cook a soup with <b>exactly</b> 3 onions</p>
    <p><b>You will advance only when you have delivered the appropriate soup</b></p>
    <p>Good luck!</p>
    <br></br>
    `,
    `
    <p>Mechanic: <b>All Orders</b></p>
    <p>Oh no! Your partner has made a grave mistake! He has mistakingly placed two onions in the pot</p>
    <p>This is an issue because no recipe on the <b>All Orders</b> list can started with 2 onions</p>
    <p>See if you can remedy the situation and cook a recipe that is indeed valid</p>
    <p><b>You will advance only when you have delivered a valid soup</b></p>
    <p>Good Luck!</p>
    <br></br>
    `,
    `
    <p>Mechanic: <b>Scoring</b></p>
    <p>Your partner is again back again busily busting out onion soups, except this time, we have a problem...</p>
    <p>The customers in this restaurant are super picky! They will only eat a soup that is worth exactly <b>${config['tutorialParams']['phaseTwoScore']} points</b></p>
    <p>Your goal here is to cooperate with your partner and cook a soup to satisfy the fastidious foodies</p>
    <p><b>You will advance only when you deliver a soup worth exactly ${config['tutorialParams']['phaseTwoScore']} points</b></p>
    <br></br>
    `,
    `
    <p>One last mechanic: <b>Bonus Orders</b></p> 
    <p>In addition to the <b>All Orders</b> list, recipes in <b>Bonus Orders</b> are worth extra points!</p>
    <p>Your goal here is to cook and deliver a <b>bonus order</b></p>
    <p>Even though you can earn reward for other orders, <b>you will advance only when you have delivered a bonus order</b></p>
    <p>Good Luck!</p>
    <br></br>
    `
];

var tutorial_hints = () => [
    `
    <p>
        You can move up, down, left, and right using
        the <b>arrow keys</b>, and interact with objects
        using the <b>spacebar</b>.
      </p>
      <p>
        You can interact with objects by facing them and pressing
        <b>spacebar</b>. Here are some examples:
        <ul>
          <li>You can pick up ingredients (onions or tomatoes) by facing
            the ingredient area and pressing <b>spacebar</b>.</li>
          <li>If you are holding an ingredient, are facing an empty counter,
            and press <b>spacebar</b>, you put the ingredient on the counter.</li>
          <li>If you are holding an ingredient, are facing a pot that is not full,
            and press <b>spacebar</b>, you will put the ingredient in the pot.</li>
          <li>If you are facing a pot that is non-empty, are currently holding nothing, and 
            and press <b>spacebar</b>, you will begin cooking a soup.</li>
        </ul>
      </p>
    `,
    `
    <p>You cannot remove ingredients from the pot. You can, however, cook any soup you like, even if it's not in <b>All Orders</b>...</p>
    `,
    `
    <p>Each onion is worth ${config['onion_value']} points and each tomato is worth ${config['tomato_value']} points<p>
    `,
    `
    <p>The bonus order here is <b>1 onion 2 tomatoes<b>. This could be determined by referring to the soup legend </p>
    `
]

var curr_tutorial_phase;

// Read in game #config provided by server
$(function() {
    // Load the JSON config from #config
    config = JSON.parse($('#config').text());

    // tutorial_instructions/hints are defined as arrays of HTML paragraphs
    tutorial_instructions = tutorial_instructions();
    tutorial_hints = tutorial_hints();

    // Show the "quit" button
    $('#quit').show();
});

/* * * * * * * * * * * * * * * * 
 * Button click event handlers *
 * * * * * * * * * * * * * * * */

// "Try Again" button restarts the tutorial by re-joining the tutorial game
$(function() {
    $('#try-again').click(function () {
        data = {
            "params" : config['tutorialParams'],
            "game_name" : "tutorial"
        };
        socket.emit("join", data);
        $('try-again').attr("disable", true);
    });
});

// "Show Hint" toggles display of the hint text
$(function() {
    $('#show-hint').click(function() {
        let text = $(this).text();
        let new_text = text === "Show Hint" ? "Hide Hint" : "Show Hint";
        $('#hint-wrapper').toggle();
        $(this).text(new_text);
    });
});


// "Quit" button leaves the tutorial and returns user to main page
$(function() {
    $('#quit').click(function() {
        socket.emit("leave", {});
        $('quit').attr("disable", true);
        window.location.href = "./";
    });
});

// "Finish" button also ends the tutorial, returning user to main page
$(function() {
    $('#finish').click(function() {
        $('finish').attr("disable", true);
        window.location.href = "./";
    });
});



/* -----------------------------------------------------------------------------
 * Socket event handlers
 * -----------------------------------------------------------------------------
 */
socket.on('creation_failed', function(data) {
    // If the server fails to make a tutorial game, show an error
    let err = data['error']
    $("#overcooked").empty();
    $('#overcooked').append(`<h4>Sorry, tutorial creation code failed with error: ${JSON.stringify(err)}</>`);
    $('#try-again').show();
    $('#try-again').attr("disabled", false);
});

socket.on('start_game', function(data) {
    // Begin tutorial at phase 0
    curr_tutorial_phase = 0;


    graphics_config = {
        container_id : "overcooked",
        start_info : data.start_info
    };

    // Clear existing text/UI from last run
    $("#overcooked").empty();
    $('#game-over').hide();
    $('#try-again').hide();
    $('#try-again').attr('disabled', true)
    $('#hint-wrapper').hide();
    $('#show-hint').text('Show Hint');

    // Update tutorial title to reflect phase
    $('#game-title').text(`Tutorial in Progress, Phase ${curr_tutorial_phase}/${tutorial_instructions.length}`);
    $('#game-title').show();

    // Insert the instructions/hints for phase 0
    $('#tutorial-instructions').append(tutorial_instructions[curr_tutorial_phase]);
    $('#instructions-wrapper').show();
    $('#hint').append(tutorial_hints[curr_tutorial_phase]);

    // Start the Overcooked environment
    enable_key_listener();
    graphics_start(graphics_config);
});

socket.on('reset_game', function(data) {
    // The server signals we finished a phase and are moving to next
    curr_tutorial_phase++;
    graphics_end();
    disable_key_listener();

    $("#overcooked").empty();
    $('#tutorial-instructions').empty();
    $('#hint').empty();

    // Insert the new phase insructions
    $("#tutorial-instructions").append(tutorial_instructions[curr_tutorial_phase]);
    $("#hint").append(tutorial_hints[curr_tutorial_phase]);

    // Update the header
    $('#game-title').text(`Tutorial in Progress, Phase ${curr_tutorial_phase + 1}/${tutorial_instructions.length}`);
    
    // If the hint was open ("Hide Hint"), we close it for the new phase
    let button_pressed = $('#show-hint').text() === 'Hide Hint';
    if (button_pressed) {
        $('#show-hint').click();
    }

    // Start up the new environment state
    graphics_config = {
        container_id : "overcooked",
        start_info : data.state
    };
    graphics_start(graphics_config);
    enable_key_listener();
});

socket.on('state_pong', function(data) {
    // Update the tutorial’s Overcooked environment with a new state
    drawState(data['state']);
});

socket.on('end_game', function(data) {
    // Hide game data and display game-over title - tutorial ended
    graphics_end();
    disable_key_listener();

    // Hide tutorial UI
    $('#game-title').hide();
    $('#instructions-wrapper').hide();
    $('#hint-wrapper').hide();
    $('#show-hint').hide();
    $('#game-over').show();
    $('#quit').hide();
    
    if (data.status === 'inactive') {
        // Game ended unexpectedly
        $('#error-exit').show();
        // Propogate game stats to parent window 
        window.top.postMessage({ name : "error" }, "*");
    } else {
        // Propogate game stats to parent window 
        window.top.postMessage({ name : "tutorial-done" }, "*");
    }

    // Show the "Finish" button so user can go back
    $('#finish').show();
});


/* -----------------------------------------------------------------------------
 * Key Event Listener
 * -----------------------------------------------------------------------------
 *
 */
function enable_key_listener() {
    $(document).on('keydown', function(e) {
        let action = 'STAY';
        switch (e.which) {
            case 37: // left arrow
                action = 'LEFT';
                break;
            case 38: // up arrow
                action = 'UP';
                break;
            case 39: // right arrow
                action = 'RIGHT';
                break;
            case 40: // down arrow
                action = 'DOWN';
                break;
            case 32: // space
                action = 'SPACE';
                break;
            default:
                return; 
        }
        e.preventDefault();
        socket.emit('action', { 'action' : action });
    });
};

function disable_key_listener() {
    $(document).off('keydown');
};

/* -----------------------------------------------------------------------------
 * Game Initialisation
 * -----------------------------------------------------------------------------
 * On socket connect, automatically attempt to join "tutorial".
 */

socket.on("connect", function() {
    let data = {
        "params" : config['tutorialParams'],
        "game_name" : "tutorial"
    };
    socket.emit("join", data);
});


/* -----------------------------------------------------------------------------
 * Utility Functions
 * -----------------------------------------------------------------------------
 */
var arrToJSON = function(arr) {
    let retval = {}
    for (let i = 0; i < arr.length; i++) {
        elem = arr[i];
        key = elem['name'];
        value = elem['value'];
        retval[key] = value;
    }
    return retval;
};