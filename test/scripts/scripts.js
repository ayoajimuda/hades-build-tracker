/**
 * This is the script for the tool. It handels:
 * building pages, saving builds, drag and drop, section resize, etc.
 *
 * @author: Plueschgiraffe
 * @date: 27.08.2021
 */

// inner html code (used as blueprints)
const BUILD_HEAD_INNER_HTML = `
   <input onchange="updateTitle(this)" class="title" spellcheck="false" type="text" />
   <button onclick="loadSection(NEW_SECTION_OBJ)">ADD SECTION</button>
   <button onclick="loadMenuPage()">ADD SKILLS</button>
   <button onclick="positionSectionsToFit()">FIT SECTIONS</button>
   <button onclick="saveBuildToFile()">SAVE BUILD</button>
   <button onclick="loadBuildFromFile()">LOAD BUILD</button>
   <button onclick="toggleSideBar()">SIDEBAR</button>
`;
const MENU_HEAD_INNER_HTML = `
   <p class="title">Skill Selection</p>
   <button onclick="loadBuildPage()">GO BACK</button>
   <button onclick="openOverlay(FILTER_OVERLAY)">FILTER</button>
   <input onchange="loadMenuPage()" placeholder="Type to search..." class="search" spellcheck="false" type="text" />
`;
const SIDE_INNER_HTML = `
   <!-- information segment for skills -->
   <div class="resize-container">
      <div id="info" class="segment">
         <p class="title">Skill Info</p>
         <div class="content"></div>
      </div>
      <div class="resizer"></div>
   </div> 

   <!-- cache segment for skills -->
   <div class="resize-container">
      <div id="cache" class="segment">
         <p class="title">Skill Cache</p>
         <div class="content">
            <div class="skill-grid"></div>  
         </div>
      </div>
   </div>
`;
const SECTION_INNER_HTML = `
   <input onchange="updateTitle(this)" class="title" spellcheck="false"type="text" />
   <div class="skill-grid-container">
      <div class="skill-grid"></div>
   </div>
   <div class="resizer"></div>
   <div class="mover"></div>
   <div onclick="deleteSection(this.parentNode)" class="deleter">&times;</div>
`;
const FILTER_ERROR_INNER_HTML = `
   Ooops...<br />
   It seems your filter settings are to strict.<br />
   Try changing them!
`;
const SKILL_INNER_HTML = (skill_data) => {
   let inner_html = `
   <img class="icon" src="${skill_data.iconsrc}" draggable="false" />
   <p class="title">${skill_data.title}</p>
   <p class="text">${skill_data.text}</p>   
`;

   // check if skill has an effect
   if (skill_data.effect.length != 0) {
      let effect_index;

      // if there is only one effect the index should be 0
      // if a rank or a rarity is set use it to find the effect index
      if (skill_data.effect.length == 1) effect_index = 0;
      else if (skill_data.rank != undefined) effect_index = skill_data.rank - 1;
      else if (skill_data.rarity != undefined)
         effect_index = SKILL_RARITYS.indexOf(skill_data.rarity);

      // set the effect to proper index
      inner_html += `<p class="effect">&rtrif; ${skill_data.effect[effect_index]}</p>`;
   }

   // add first tag if it exist
   if (skill_data.tags.length != 0)
      inner_html += `<img class="tag" src="img/Tags/${skill_data.tags[0]}.webp" draggable="false" />`;

   // check for duo boons / hammer and add second tag
   if (skill_data.tags.length == 2)
      inner_html += `<img class="tag left-tag" src="img/tags/${skill_data.tags[1]}.webp" draggable="false" />`;

   // check if skill is deletable
   if (skill_data.deletable)
      inner_html += `<div onclick="deleteSkill(this.parentNode)" class="deleter">&times;</div>`;

   // check if skill has a rank
   if (skill_data.rank != undefined)
      inner_html += `<p class="rank">${skill_data.rank} / ${
         skill_data.effect.length > 0 ? skill_data.effect.length : 1
      }</p>`;

   // check if skill has a price
   if (skill_data.price != undefined)
      inner_html += `<p class="price">${skill_data.price}</p>`;

   return inner_html;
};

// skill setting presets
const BUILD_RARITY_SETTINGS = {
   draggable: true,
   deletable: true,
   mini_skill: false,
   onclick: 'change rarity',
   onrightclick: 'show skill details',
};
const BUILD_RANK_SETTINGS = {
   draggable: true,
   deletable: true,
   mini_skill: false,
   onclick: 'change rank',
   onrightclick: 'show skill details',
};
const MENU_SKILL_SETTINGS = {
   draggable: false,
   deletable: false,
   mini_skill: false,
   onclick: 'add to cache',
   onrightclick: 'show skill details',
};
const CACHE_RARITY_SETTINGS = {
   draggable: true,
   deletable: true,
   mini_skill: false,
   onclick: 'change rarity',
   onrightclick: 'show skill details',
};
const CACHE_RANK_SETTINGS = {
   draggable: true,
   deletable: true,
   mini_skill: false,
   onclick: 'change rank',
   onrightclick: 'show skill details',
};
const MINI_SKILL_SETTINGS = {
   draggable: false,
   deletable: false,
   mini_skill: true,
   onclick: 'add to cache',
   onrightclick: 'show skill details',
};
const INFO_RARITY_SETTINGS = {
   draggable: false,
   deletable: false,
   mini_skill: false,
   onclick: 'add to cache',
   onrightclick: 'change rarity',
};
const INFO_RANK_SETTINGS = {
   draggable: false,
   deletable: false,
   mini_skill: false,
   onclick: 'add to cache',
   onrightclick: 'change rank',
};

// overlay settings
const FILTER_OVERLAY = {
   inner_html: `
      <div class="head">
         <p class="title">Filter Settings</p>
         <div class="deleter" onclick="closeOverlay()">&times;</div>
      </div>
     
      <div class="body">
         <div class="filter-table">

            <div class="column">
               <p class="title">GENERAL</p>

               <input id="boon-general" type="checkbox" />
               <label for="boon-general">Boon</label><br />
               
               <input id="weapon-general" type="checkbox" />
               <label for="weapon-general">Weapon</label><br />

               <input id="item-general" type="checkbox" />
               <label for="item-general">Item</label><br />

               <input id="mirror-general" type="checkbox" />
               <label for="mirror-general">Mirror</label><br />

               <input id="heat-general" type="checkbox" />
               <label for="heat-general">Heat</label><br />
            </div>

            <div class="column">
               <p class="title">GODS</p>

               <input id="aph-god" type="checkbox" />
               <label for="aph-god">Aphrodite</label><br />

               <input id="are-god" type="checkbox" />
               <label for="are-god">Ares</label><br />

               <input id="art-god" type="checkbox" />
               <label for="art-god">Artemis</label><br />

               <input id="ath-god" type="checkbox" />
               <label for="ath-god">Athena</label><br />

               <input id="dem-god" type="checkbox" />
               <label for="dem-god">Demeter</label><br />

               <input id="dio-god" type="checkbox" />
               <label for="dio-god">Dionysus</label><br />

               <input id="pos-god" type="checkbox" />
               <label for="pos-god">Poseidon</label><br />

               <input id="zeu-god" type="checkbox" />
               <label for="zeu-god">Zeus</label><br />

               <input id="her-god" type="checkbox" />
               <label for="her-god">Hermes</label><br />

               <input id="cha-god" type="checkbox" />
               <label for="cha-god">Chaos</label><br />
            </div>

            <div class="column">
               <p class="title">BOONS</p>

               <input id="active-boon1" type="checkbox" />
               <label for="active-boon1">Active</label><br />

               <input id="passive-boon1" type="checkbox" />
               <label for="passive-boon1">Passive</label><br />

               <hr class="divider" />

               <input id="pomable-boon2" type="checkbox" />
               <label for="pomable-boon2">Pomable</label><br />

               <input id="notpom-boon2" type="checkbox" />
               <label for="notpom-boon2">Not Pom.</label><br />

               <hr class="divider" />

               <input id="duo-boon3" type="checkbox" />
               <label for="duo-boon3">Duo</label><br />

               <input id="legendary-boon3" type="checkbox" />
               <label for="legendary-boon3">Legendary</label><br />

               <input id="other-boons-boon3" type="checkbox" />
               <label for="other-boons-boon3">Other</label><br />
            </div>

            <div class="column">
               <p class="title">WEAPONS</p>

               <input id="bla-weapon1" type="checkbox" />
               <label for="bla-weapon1">Blade</label><br />

               <input id="spe-weapon1" type="checkbox" />
               <label for="spe-weapon1">Spear</label><br />

               <input id="bow-weapon1" type="checkbox" />
               <label for="bow-weapon1">Bow</label><br />

               <input id="shi-weapon1" type="checkbox" />
               <label for="shi-weapon1">Shield</label><br />

               <input id="fis-weapon1" type="checkbox" />
               <label for="fis-weapon1">Fists</label><br />

               <input id="rai-weapon1" type="checkbox" />
               <label for="rai-weapon1">Rail</label><br />

               <hr class="divider" />

               <input id="aspect-weapon2" type="checkbox" />
               <label for="aspect-weapon2">Aspect</label><br />

               <input id="mod-weapon2" type="checkbox" />
               <label for="mod-weapon2">Mod</label><br />
            </div>

            <div class="column last-column">
               <p class="title">ITEMS</p>

               <input id="keepsake-item" type="checkbox" />
               <label for="keepsake-item">Keepsake</label><br />

               <input id="companion-item" type="checkbox" />
               <label for="companion-item">Companion</label><br />

               <input id="consumable-item" type="checkbox" />
               <label for="consumable-item">Consumable</label><br />

               <input id="reward-items-item" type="checkbox" />
               <label for="reward-items-item">Reward</label><br />
            </div>

         </div>
      </div>
   `,
   setup_function: setupFilterOverlay,
};

// important hardcoded sizes in pixel
const ACTUAL_SKILL_WIDTH = 424;
const ACTUAL_SKILL_HEIGHT = 124;
const ACTUAL_SIDE_WIDTH = 486.5;
const GENERAL_MARGIN = 20;
const SECTION_GAP = 55;
const HEAD_HEIGHT = 110;
const BACKGROUND_GRID_SIZE = 35;

// rarity names as array
const SKILL_RARITYS = ['common', 'rare', 'epic', 'heroric', 'legendary'];

// data - skill data is loaded once at the start
// while build data is modified constantly by user input
let SKILL_DATA;
let BUILD_DATA = {
   title: 'Enter Title',
   sections: [],
};

// section data presets
const NEW_SECTION_OBJ = {
   title: 'New Section',
   position: { x: SECTION_GAP, y: SECTION_GAP },
   columns: 1,
   skills: [],
   // important for recognizing new sections
   new: 0,
};

// active menu filters - default: no filters (all skills show up)
const ACTIVE_MENU_FILTERS = {
   general: [],
   god: [],
   boon1: [],
   boon2: [],
   boon3: [],
   weapon1: [],
   weapon2: [],
   item: [],
   // do not use ES6 arrow function here or 'this' will be set
   // in the calling scope and not refer to active menu filters
   all: function () {
      let all_filters = [];
      // concat all filter arrays and return it
      for (const [filter_type, filters] of Object.entries(this)) {
         if (filter_type != 'all') all_filters = all_filters.concat(filters);
      }
      return all_filters;
   },
};

// get static main structure html elements
const HEAD_HTML = document.getElementById('head');
const BODY_HTML = document.getElementById('body');
const SIDE_HTML = document.getElementById('side');
const OVERLAY_HTML = document.getElementById('overlay');
const OVERBOX_HTML = document.getElementById('overbox');

// these elements do not exists until created therefore
// functions are used to return the elements once created
const INFO_HTML = () => document.getElementById('info');
const CACHE_HTML = () => document.getElementById('cache');

// start up the tool
startup();

/**
 * Starts up the tool. This includes loading in the skill data from the
 * json file, loading up the build page, and loading up the side bar.
 */
function startup() {
   // prevent window right click menu
   document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
   });

   // load skill data from json file - then load build page
   fetch('data.json')
      .then((response) => response.json())
      .then((data) => {
         SKILL_DATA = data;
         // after skill data loading is done initialize the tool
         setupBodyMovement();
         loadBuildPage();
         loadSideBar();
      });
}

/**
 * Adds the needed event lisener to the body (div -
 * html element) to allow for free movement in it.
 */
function setupBodyMovement() {
   // initial offset values for the background after each movement
   let initial_offset_x = 0;
   let initial_offset_y = 0;

   // add event lisener to body (div - html element)
   BODY_HTML.addEventListener('mousedown', (event) => {
      // should only work with middle mouse click and if not in the menu page
      if (
         event.button == 1 &&
         HEAD_HTML.querySelector('.title').value != 'Skill Selection'
      )
         mousedown(event);
   });

   /**
    * Gets called whenever the user middle mouse clicks on the body (div).
    * Sets evrything up (event liseners, initial calculations, etc.) to
    * allow for full body movement (background and all sections at once).
    *
    * @param {Object} event The event given by the event handler.
    */
   function mousedown(event) {
      // change cursor to indicate movement and block
      // all other visual effects triggered by the mouse
      toggleAllVisualEffects();
      BODY_HTML.style.cursor = 'move';

      // save current mouse position
      let old_mouse_x = event.clientX;
      let old_mouse_y = event.clientY;

      // set delta sums to initial background offsets
      let delta_sum_x = initial_offset_x;
      let delta_sum_y = initial_offset_y;

      // calculate current background offsets
      const offset_x = old_mouse_x % BACKGROUND_GRID_SIZE;
      const offset_y = (old_mouse_y - HEAD_HEIGHT) % BACKGROUND_GRID_SIZE;

      // get all sections of the build and add event liseners to window
      const sections_html = BODY_HTML.querySelectorAll('.section');
      window.addEventListener('mousemove', mousemove);
      window.addEventListener('mouseup', mouseup);

      /**
       * Toggles all visual effects of the build area on or off
       * (e.g. grab cursors, red delete buttons, skill scaling etc.).
       */
      function toggleAllVisualEffects() {
         // grab all important html elements
         const deleter_html = BODY_HTML.querySelectorAll('.deleter');
         const resizer_html = BODY_HTML.querySelectorAll('.resizer');
         const mover_html = BODY_HTML.querySelectorAll('.mover');
         const titles_html = BODY_HTML.querySelectorAll('.title');
         const skills_html = BODY_HTML.querySelectorAll('.skill');

         // go through all of them and...
         // ... add or remove 'wait-for-drag' class
         for (const element_html of [
            ...deleter_html,
            ...resizer_html,
            ...mover_html,
            ...titles_html,
            ...skills_html,
         ])
            if (element_html.classList.contains('wait-for-drag'))
               element_html.classList.remove('wait-for-drag');
            else element_html.classList.add('wait-for-drag');
      }

      /**
       * Gets called whenever the user moves the mouse on the window, while middle
       * mouse click holding. Handels all needed calculations for movement of the
       * background and all sections.
       *
       * @param {Object} event
       */
      function mousemove(event) {
         // save current mouse position
         const new_mouse_x = event.clientX;
         const new_mouse_y = event.clientY;

         // calculate mouse movement deltas
         const delta_x = new_mouse_x - old_mouse_x;
         const delta_y = new_mouse_y - old_mouse_y;

         // add them to their respective delta sums
         delta_sum_x += delta_x;
         delta_sum_y += delta_y;

         // set the background to the correct position
         document.body.style.backgroundPositionX =
            new_mouse_x - offset_x + initial_offset_x + 'px';
         document.body.style.backgroundPositionY =
            new_mouse_y - offset_y + initial_offset_y + 'px';

         // move all sections (html) to the correct position
         for (const section_html of sections_html) {
            section_html.moveX(delta_x);
            section_html.moveY(delta_y);
         }

         // save current mouse position for as old one for next time
         old_mouse_x = new_mouse_x;
         old_mouse_y = new_mouse_y;
      }

      /**
       * Gets called whenever the user realeses the middle mouse button on
       * the window after he already clicked it on the body (div - html).
       * Removes all unneeded event handlers and saves important values.
       */
      function mouseup() {
         // change curser back to default and reallow
         // all visual effects triggered by the mouse
         toggleAllVisualEffects();
         BODY_HTML.style.cursor = 'default';

         // save new background offsets as initial ones for next time
         initial_offset_x = delta_sum_x % BACKGROUND_GRID_SIZE;
         initial_offset_y = delta_sum_y % BACKGROUND_GRID_SIZE;

         // save position of all sections (html) to build data
         for (const section_html of sections_html)
            getSectionObjById(section_html.id).position = {
               x: section_html.offsetLeft,
               y: section_html.offsetTop,
            };

         // remove event liseners from window
         window.removeEventListener('mousemove', mousemove);
         window.removeEventListener('mouseup', mouseup);
      }
   }
}

/**
 * Opens and sets up the overlay (html) and overbox (html)
 * according to given settings (object).
 *
 * @param {Object} overlay_settings
 *    The settings for the overlay. Must contain
 *    '.inner_html' and '.setup_function()'.
 */
function openOverlay(overlay_settings) {
   // load overbox inner html and setup the overbox
   OVERBOX_HTML.innerHTML = overlay_settings.inner_html;
   overlay_settings.setup_function();

   // show overlay and overbox through css
   OVERLAY_HTML.classList.add('active');
   OVERBOX_HTML.classList.add('active');
}

/**
 * Closes the overlay and overbox (html elements).
 */
function closeOverlay() {
   // hide overlay and overbox through css
   OVERLAY_HTML.classList.remove('active');
   OVERBOX_HTML.classList.remove('active');
}

/**
 * Sets up the functionality of the Filter Settings overlay and overbox.
 */
function setupFilterOverlay() {
   // get all checkboxes (html) and
   const checkboxes_html = OVERBOX_HTML.querySelectorAll('input');

   // visually check all checkboxes which filters are currently active
   for (const filter_tag of ACTIVE_MENU_FILTERS.all())
      getCheckboxHtml(filter_tag).checked = true;

   // add event liseners to the checkboxes (html)
   for (const checkbox_html of checkboxes_html) {
      checkbox_html.addEventListener('change', updateFilters);
   }

   // get close button (div - deleter - html) of the overbox
   const deleter_html = OVERBOX_HTML.querySelector('.deleter');

   // add event lisener to it and the overlay
   OVERLAY_HTML.addEventListener('click', closeFilterSettings);
   deleter_html.addEventListener('click', closeFilterSettings);

   /**
    * Removes the click event lisener from the overlay and the deleter
    * and reloads the menu page (which automaticly uses the new filters).
    */
   function closeFilterSettings() {
      // remove event liseners from overlay and deleter
      OVERLAY_HTML.removeEventListener('click', closeFilterSettings);
      deleter_html.removeEventListener('click', closeFilterSettings);

      // reload menu page
      loadMenuPage();
   }

   /**
    * Looks for and returns the checkbox (html element) that corre-
    * sponds to the given filter tag (e.g. 'weapon-general').
    *
    * @param {String} filter_tag The filter tag to find the checkbox of.
    * @returns {Object} The corresponding checkbox (html element).
    */
   function getCheckboxHtml(filter_tag) {
      for (const checkbox_html of checkboxes_html)
         if (filter_tag == checkbox_html.id) return checkbox_html;
   }

   /**
    * Updates the global active menu filters array to
    * match the user selected filter checkboxes.
    *
    * @param {Object} event The event given by the event handler.
    */
   function updateFilters(event) {
      // filter type by filter tag
      const filter_type = (filter_tag) => {
         const filter_type = filter_tag.split('-');
         return filter_type[filter_type.length - 1];
      };

      // get the calling checkbox (html) and its filter tag (string)
      const checkbox_html = event.target;
      const filter_tag = checkbox_html.id;

      // depending on whether the checkbox was cleared or checked
      // remove or add filter tag ot global active menu filter object
      if (checkbox_html.checked) addFilterTag(filter_tag);
      else removeFilterTag(filter_tag);

      /**
       * Adds the given filter tag to the correct part
       * of the active menu filters object.
       *
       * @param {String} filter_tag The filter tag to add.
       */
      function addFilterTag(filter_tag) {
         ACTIVE_MENU_FILTERS[filter_type(filter_tag)].push(filter_tag);
      }

      /**
       * Removes the given filter tag from the correct
       * part of the active menu filters object.
       *
       * @param {String} filter_tag The filter tag to remove.
       */
      function removeFilterTag(filter_tag) {
         ACTIVE_MENU_FILTERS[filter_type(filter_tag)].remove(filter_tag);
      }
   }
}

/**
 * Removes a skill (div - html) from its skill grid (div - html).
 *
 * @param {Object} skill_html The skill html element to remove.
 */
function deleteSkill(skill_html) {
   // get skill grid and remove the skill from it
   const skill_grid_html = skill_html.parentNode;
   skill_grid_html.removeChild(skill_html);

   // resize sections (if needed) to accomidate for skill grid change
   const section_html = skill_grid_html.parent(2);
   if (section_html.classList.contains('section')) {
      snapSectionToGridSize(section_html);
      updateBuildData();
   }
}

/**
 * Saves build data into a json file and downloads it.
 */
function saveBuildToFile() {
   // create the file object from build data
   const save_file = new Blob([JSON.stringify(BUILD_DATA)], {
      type: 'application/json',
   });

   // create a (invisible) hyperlink to the file
   // object above and set it up for file download
   const file_link = document.createElement('a');
   file_link.href = URL.createObjectURL(save_file);
   file_link.download = BUILD_DATA.title + '.json';

   // trigger file download and remove link afterwards
   file_link.click();
   URL.revokeObjectURL(file_link.href);
}

/**
 * Loads up a build saved in a json file by saveBuildToFile(). Includes
 * saving info from file into build data and loading up the build page.
 */
function loadBuildFromFile() {
   // create a (invisible) file input (html element)
   const input = document.createElement('input');
   input.type = 'file';

   // add event lisener for when the user has chosen a file
   input.addEventListener('change', processSaveFile);

   // trigger file input dialog to show up
   input.click();

   /**
    * Gets called after the user has chosen a file in the file input dialog
    * above. Saves the files info into build data and loads up the build page.
    *
    * @param {Object} event The file input event given by the event handler.
    */
   function processSaveFile(event) {
      // get the save file from the input event
      const save_file = event.target.files[0];

      // read the content of the save file interpreted as text
      save_file.text().then((file_text) => {
         // once reading is completed save data and load build page
         BUILD_DATA = JSON.parse(file_text);
         loadBuildPage();
      });
   }
}

/**
 * Loads up the side bar.
 */
function loadSideBar() {
   // set up side (div - html elements)
   SIDE_HTML.innerHTML = SIDE_INNER_HTML;

   // setup resize ability of the segments
   setupResizer();

   // set up cache grid (div - html element) as normal skill grid
   const cache_grid_html = SIDE_HTML.querySelector('.skill-grid');
   setupSkillGrid(cache_grid_html);

   /**
    * Sets up the resizer element of the side bar. Allows the user
    * to change the amount of space the info and the cache segment use.
    */
   function setupResizer() {
      // get resizer (div - html) and add event lisener to it
      const resizer_html = SIDE_HTML.querySelector('.resizer');
      resizer_html.addEventListener('mousedown', mousedown);

      // add event lisener to window for zoom level fix
      window.addEventListener('resize', correctForZoom);

      /**
       * Gets called when the user zooms in or out. Correts
       * the segments height fo the current zoom level.
       */
      function correctForZoom() {
         // get heights and calculate needed correction
         const height = getSegmentHeight();
         const height_correction = height.side - (height.info + height.cache);

         // resize cache segment accordingly
         CACHE_HTML().parentNode.style.height =
            height.cache + height_correction + 'px';
      }

      /**
       * Adds the needed event liseners that allow for resizing
       * of the two side bar segments (cache and info).
       *
       * @param {Object} event The event given by the event handler.
       */
      function mousedown(event) {
         // get the mouse y-position when the user first clicked the resizer
         let previous_mouse_y = event.clientY;

         // add event liseners to window to further
         // track mouse movement and for resizing
         window.addEventListener('mousemove', mousemove);
         window.addEventListener('mouseup', mouseup);

         /**
          * Resizes both segments (info and cache) of the
          * side bar according to the users mouse movement.
          *
          * @param {Object} event The event given by the event handler.
          */
         function mousemove(event) {
            // calculate mouse distance travelled on
            // y axis since last time mousemove was called
            const delta_y = event.clientY - previous_mouse_y;

            // get the current heights of the segments
            const height = getSegmentHeight();

            // calculate new segment heights (-2px border width)
            let new_info_height = height.info + delta_y - 2;
            let new_cache_height = height.cache - delta_y - 2;

            // actually resize the segments now
            INFO_HTML().parentNode.style.height = new_info_height + 'px';
            CACHE_HTML().parentNode.style.height = new_cache_height + 'px';

            // save current mouse position for next time
            previous_mouse_y = event.clientY;
         }

         /**
          * Removes the for resizing of the segments added event liseners.
          */
         function mouseup() {
            // remove all in mousedown set event liseners from window
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);
         }
      }

      /**
       * Finds and returns the heights of the sidebar and its segments.
       *
       * @returns {Object} Object with .side, .info, .cache heights.
       */
      function getSegmentHeight() {
         // get side and the segments (html)
         const side_container = SIDE_HTML;
         const info_container = INFO_HTML().parentNode;
         const cache_container = CACHE_HTML().parentNode;

         // get their bounding client rect
         const side_rect = side_container.getBoundingClientRect();
         const info_rect = info_container.getBoundingClientRect();
         const cache_rect = cache_container.getBoundingClientRect();

         // get their heights and return it
         const side = Math.ceil(side_rect.height);
         const info = Math.ceil(info_rect.height);
         const cache = Math.ceil(cache_rect.height);

         return { side, info, cache };
      }
   }
}

/**
 * Opens or closes the side bar (div - html) of the page.
 *
 * @param {Boolean} instant_toggle
 *    Whether to intstantly toggle the sidebar or not. Optional and default is false.
 */
function toggleSideBar(instant_toggle) {
   if (instant_toggle || false) SIDE_HTML.classList.remove('smooth');
   // if side bar is closed open it else close it, also
   // make body smaller or wider adjusting for the side bar
   if (SIDE_HTML.classList.contains('hidden')) {
      SIDE_HTML.classList.remove('hidden');
      BODY_HTML.classList.add('smaller');
   } else {
      SIDE_HTML.classList.add('hidden');
      BODY_HTML.classList.remove('smaller');
   }
}

/**
 * Loads up the menu page according to current global filter and search settings.
 */
function loadMenuPage() {
   // if side bar is closed instantly open it and make body scrollable
   if (SIDE_HTML.classList.contains('hidden')) toggleSideBar(true);
   BODY_HTML.classList.add('scrollable');

   // get and save old serach value
   let search_html = HEAD_HTML.querySelector('.search');
   let search_value = '';
   if (search_html != undefined) search_value = search_html.value;

   // clean up head and body (div - html elements)
   HEAD_HTML.innerHTML = '';
   BODY_HTML.innerHTML = '';

   // set up head (div - html element)
   HEAD_HTML.innerHTML = MENU_HEAD_INNER_HTML;
   updateTitle(HEAD_HTML.querySelector('.title'));

   // set new search value
   search_html = HEAD_HTML.querySelector('.search');
   search_html.value = search_value;

   // get skill category names and data seperated - also apply current menu filters
   // to the data and SKILL_DATA.slice(1) is default if pre_choosen_data is undefined
   const category_names = SKILL_DATA[0];
   const skill_data = applyFilters(getSearchResult());

   // check if skill data is empty
   let skill_data_empty = true;
   for (const category of skill_data)
      if (category.length > 0) {
         skill_data_empty = false;
         break;
      }

   // if skill data is empty display a error message
   if (skill_data_empty) {
      const filter_error_html = document.createElement('p');
      filter_error_html.classList.add('error');
      filter_error_html.innerHTML = FILTER_ERROR_INNER_HTML;
      BODY_HTML.appendChild(filter_error_html);
   }

   // for each category create a title (p) and a skill grid (div)
   for (const category of skill_data) {
      // if the category is empty skip it
      if (category.length == 0) continue;

      // create and set up a title for the category
      const categroy_title_html = document.createElement('p');
      categroy_title_html.classList.add('title');
      categroy_title_html.innerText =
         category_names[skill_data.indexOf(category)];
      BODY_HTML.appendChild(categroy_title_html);

      // create and set up skill grid for the category
      const skill_grid_html = document.createElement('div');
      skill_grid_html.classList.add('skill-grid');

      // add the skills (div - html) to the skill grid (div - html)
      for (const skill_data of category) {
         // on the menu page skill (div - html element) should not be draggable
         const skill_html = createSkillHtml(skill_data, MENU_SKILL_SETTINGS);
         skill_grid_html.appendChild(skill_html);
      }

      // add the skill grid to the body
      BODY_HTML.appendChild(skill_grid_html);
   }

   /**
    * Searches through skill data (SKILL_DATA.slice(1)) and returns only those
    * parts of it that contain the search string given by the user in the search
    * bar in their title, their text, or their effect.
    *
    * @returns {Array} The parts of the skill data array that include the search string.
    */
   function getSearchResult() {
      // put the search string in lower case for caseINsensitivity
      search_string = HEAD_HTML.querySelector('.search').value.toLowerCase();

      // set to save all found skill objects in
      let search_result = new Set();

      // loop through all skills (html) and check if they contain
      // the search string in their title or text (caseINsensitive)
      for (const category of SKILL_DATA.slice(1))
         for (const skill_obj of category) {
            // get skill title, text, an effect all in lower case
            const skill_title = skill_obj.title.toLowerCase();
            const skill_text = skill_obj.text.toLowerCase();
            const skill_effect = skill_obj.effect
               .reduce((result, effect) => result + effect, '')
               .toLowerCase();

            // if the search string is found in the title or text
            // of a skill add the skill object to search result
            if (
               skill_title.includes(search_string) ||
               skill_text.includes(search_string) ||
               skill_effect.includes(search_string)
            )
               search_result.add(skill_obj);
         }

      // reduce and return the skill data array to just the parts
      // of it that apply to search (skills in search_result)
      return SKILL_DATA.slice(1).reduce((result, category) => {
         // reduce each category of skill data down to just the filtered skills
         category = category.reduce((skills, skill) => {
            if (search_result.has(skill)) skills.push(skill);
            return skills;
         }, []);
         // add reduced category to result and return it
         result.push(category);
         return result;
      }, []);
   }

   /**
    * Applys the user selected filters to the given skill (obj) data
    * and returns a new array with only thoses skills that obey the filters.
    *
    * @param {Array} skill_data The skill (obj) data (without the naming section).
    * @returns {Array} Filtered skill data. Includes only skills that obey the filters.
    */
   function applyFilters(skill_data) {
      // all category names relevant for filtering
      const category_names = ['boon', 'weapon', 'item', 'mirror', 'heat'];

      // filter name by filter tag
      const filter_name = (filter_tag) => {
         const filter_name = filter_tag.split('-');
         return filter_name[0];
      };

      // indices of all subcategorys of a category by its name
      const category_indices = (category_name) => {
         // data to map category names to indices of the corresponding categorys
         const category_indices = [
            { start: 0, end: 11 },
            { start: 12, end: 17 },
            { start: 18, end: 22 },
            { start: 23, end: 23 },
            { start: 24, end: 24 },
         ];

         // map and return category name to category indices
         return category_indices[category_names.indexOf(category_name)];
      };

      // returns a filter that returns whether a given
      // skill object has any of the given god tags
      const god_filter = (god_tags) => (skill_obj) =>
         skill_obj.tags.concat(god_tags).hasDuplicates();

      // returns a filter that returns whether a given
      // skill object has the correct pomable setting
      const pomable_filter = (pomable) => (skill_obj) =>
         skill_obj.pomable == pomable;

      // returns a filter that returns whether a given
      // skill object is passive or active (dep. on invert)
      const passive_filter = (invert) => (skill_obj) =>
         ['P', 'L'].includes(skill_obj.id.slice(-1)) != invert;

      // returns a filter that returns whether a given
      // skill (boon) object has one of the given types
      const boon_type_filter = (boon_types) => (skill_obj) => {
         // the type of the boon ('duo', 'legendary', 'other', 'none')
         const skill_type = () => {
            if (skill_obj.id.substring(0, 3) == 'DUO') return 'duo';
            if (skill_obj.id.slice(-1) == 'L') return 'legendary';
            if (skill_data[10].includes(skill_obj)) return 'other';

            return 'none';
         };

         // return if any of the given types match the boon obj type
         return boon_types.includes(skill_type());
      };

      // returns a filter that returns whether a given
      // skill object has any of the given weapon tags
      const weapon_filter = (weapon_tags) => (skill_obj) =>
         skill_obj.tags.concat(weapon_tags).hasDuplicates();

      // returns a filter that returns whether a given skill
      // object is a aspect or a mod (depends on aspect_or_mod)
      const aspect_mod_filter = (aspect_or_mod) => (skill_obj) => {
         if (aspect_or_mod == 'aspect') return skill_obj.id.slice(-1) == 'A';
         else return skill_obj.id.slice(-1) == 'H';
      };

      // returns a filter that returns whether a given
      // skill (item) object has one of the given types
      const item_type_filter = (item_types) => (skill_obj) => {
         // the type of the item ('keepsake', 'companion', 'reward', 'consumable', 'none')
         const item_type = () => {
            switch (skill_obj.id.substring(0, 3)) {
               case 'KEP':
                  return 'keepsake';
               case 'COM':
                  return 'companion';
               case 'ITE':
                  // check if its a reward item or not
                  if (skill_obj.tags.includes('FRE')) return 'reward';
                  else return 'consumable';
               default:
                  return 'none';
            }
         };

         // return if any of the given types match the item obj type
         return item_types.includes(item_type());
      };

      // create a set to put all skills (obj) into that obey the filters
      const filtered_skills = new Set();

      // no filters at all should be the same as all filters
      if (ACTIVE_MENU_FILTERS.length == 0) return skill_data;

      // 1st apply general filters to get the base set of skills
      // no general filters should be the same as all general filters
      if (ACTIVE_MENU_FILTERS.general.length == 0)
         for (const category_name of category_names)
            includeFullCategory(category_name);
      else
         for (const filter_tag of ACTIVE_MENU_FILTERS.general)
            includeFullCategory(filter_name(filter_tag));

      // 2nd apply god filters to skills in filtered set from the boon category
      // no god filters should be the same as all god filters
      if (![0, 10].includes(ACTIVE_MENU_FILTERS.god.length)) {
         // get god tags to filter for
         let god_tags = ACTIVE_MENU_FILTERS.god.map((filter_tag) =>
            filter_name(filter_tag)
         );
         // make sure all god tags are upper case
         god_tags = god_tags.map((god_tag) => god_tag.toUpperCase());
         filterCategory('boon', god_filter(god_tags));
      }

      // 3rt apply boon1 filters to skills in filtered set from the boon category
      // no (0) boon1 filters should be the same as all (2) boon1 filters
      if (ACTIVE_MENU_FILTERS.boon1.length == 1) {
         const invert = filter_name(ACTIVE_MENU_FILTERS.boon1[0]) != 'passive';
         filterCategory('boon', passive_filter(invert));
      }

      // 4th apply boon2 filters tok skills in filtered set from the boon category
      // no (0) boon2 filters should be the same as all (2) boon2 filters
      if (ACTIVE_MENU_FILTERS.boon2.length == 1) {
         const pomable = filter_name(ACTIVE_MENU_FILTERS.boon2[0]) == 'pomable';
         filterCategory('boon', pomable_filter(pomable));
      }

      // 5th apply boon3 filters tok skills in filtered set from the boon category
      // no (0) boon3 filters should be ignored but all (3) boon3 filters should be applied
      if (ACTIVE_MENU_FILTERS.boon3.length != 0) {
         const boon_types = ACTIVE_MENU_FILTERS.boon3.map((filter_tag) =>
            filter_name(filter_tag)
         );
         filterCategory('boon', boon_type_filter(boon_types));
      }

      // 6th apply weapon1 filters tok skills in filtered set from the weapon category
      // no (0) weapon1 filters should be the same as all (6) weapon1 filters
      if (![0, 6].includes(ACTIVE_MENU_FILTERS.weapon1.length)) {
         // get weapon tags to filter for
         let weapon_tags = ACTIVE_MENU_FILTERS.weapon1.map((filter_tag) =>
            filter_name(filter_tag)
         );
         // make sure all weapon tags are upper case
         weapon_tags = weapon_tags.map((weapon_tag) =>
            weapon_tag.toUpperCase()
         );
         filterCategory('weapon', weapon_filter(weapon_tags));
      }

      // 7th apply weapon2 filters tok skills in filtered set from the weapon category
      // no (0) weapon2 filters should be the same as all (2) weapon2 filters
      if (ACTIVE_MENU_FILTERS.weapon2.length == 1) {
         const aspect_or_mod = filter_name(ACTIVE_MENU_FILTERS.weapon2[0]);
         filterCategory('weapon', aspect_mod_filter(aspect_or_mod));
      }

      // 8th apply item filters tok skills in filtered set from the weapon category
      // no (0) item filters should be the same as all (4) item filters
      if (![0, 4].includes(ACTIVE_MENU_FILTERS.item.length)) {
         const item_tags = ACTIVE_MENU_FILTERS.item.map((filter_tag) =>
            filter_name(filter_tag)
         );
         filterCategory('item', item_type_filter(item_tags));
      }

      // reduce and return the skill data array to just the parts of it
      // that apply to the active menu filters (skills in filtered_skills)
      return skill_data.reduce((result, category) => {
         // reduce each category of skill data down to just the filtered skills
         category = category.reduce((skills, skill) => {
            if (filtered_skills.has(skill)) skills.push(skill);
            return skills;
         }, []);
         // add reduced category to result and return it
         result.push(category);
         return result;
      }, []);

      /**
       * Adds full all skills (obj) from all categorys of skill data
       * with the given category type to the filtered skill set.
       *
       * @param {String} category_name
       *    The name of the category ('boon', 'weapon', 'item', 'mirror', 'heat').
       */
      function includeFullCategory(category_name) {
         // find (sub)category indices by its name
         const indices = category_indices(category_name);

         // add all skills from those (sub)categorys to filtered skill set
         for (index = indices.start; index <= indices.end; index++)
            for (const skill_obj of skill_data[index])
               filtered_skills.add(skill_obj);
      }

      /**
       * Filters the skills in filtered skill set of the given category (name) for meeting
       * the given condition. All skills not meeting this condition will be removed.
       *
       * @param {String} category_name The name of the category to filter.
       * @param {Function} filter_condition
       *    The condition a skill object should meet to not get filtered out.
       *    Needs to be a function that takes a skill object and returns a boolen.
       */
      function filterCategory(category_name, filter_condition) {
         // loop through all skills (obj) in filtered skill set
         for (const skill_obj of filtered_skills) {
            // if a skill is not from the given category skip it
            if (!skillInCategory(skill_obj, category_name)) continue;

            // else check whether it meets the given filter condition
            // if not remove it from the filtered skill set
            if (!filter_condition(skill_obj)) filtered_skills.delete(skill_obj);
         }

         /**
          * Checks and returns whether the given skill (obj)
          * is in the category with the given name (string).
          *
          * @param {Object} skill_obj The skill object to look for.
          * @param {String} category_name The name of the category.
          * @returns {Boolean} Whether the skill is in the category or not.
          */
         function skillInCategory(skill_obj, category_name) {
            // find (sub)category indices by its name
            const indices = category_indices(category_name);

            // loop through all those (sub)categorys and look for the skill
            for (index = indices.start; index <= indices.end; index++)
               if (skill_data[index].includes(skill_obj)) return true;

            // if the code reaches here, the skill was not in the category
            return false;
         }
      }
   }
}

/**
 * Loads up the build page according to the build data (array).
 */
function loadBuildPage() {
   // clean up head and body (div - html elements)
   HEAD_HTML.innerHTML = '';
   BODY_HTML.innerHTML = '';

   // set up head (div - html element)
   HEAD_HTML.innerHTML = BUILD_HEAD_INNER_HTML;

   // set up body (div - html element)
   if (BODY_HTML.classList.contains('scrollable'))
      BODY_HTML.classList.remove('scrollable');

   // set up side (div - html element)
   if (!SIDE_HTML.classList.contains('smooth'))
      SIDE_HTML.classList.add('smooth');

   // set up build title (input - html element)
   const title_html = HEAD_HTML.querySelector('.title');
   title_html.value = BUILD_DATA.title;
   updateTitle(title_html);

   // go through all sections (obj) in build (array) and load them
   for (const section_obj of BUILD_DATA.sections) loadSection(section_obj);
}

/**
 * Formats title of given html element (<p> or <input>) and resizes it to fit
 * the title exactly at given font (name and size).
 *
 * Also updates section object title if given html element is a section. But for
 * this to work the section NEEDS TO HAVE A ID or the function will throw a error.
 *
 * Also updates the build title in build data if it was changed on the build page.
 *
 * @param {Object} title_html The html element (<p> or <input>) with class title.
 */
function updateTitle(title_html) {
   // grab title depending on the type of html element given
   let title;
   switch (title_html.nodeName) {
      case 'P':
         title = title_html.innerText;
         break;
      case 'INPUT':
         title = title_html.value;
         break;
   }

   // format title and save to html element
   title = formatTitle(title);
   title_html.value = title;

   // save to section object if its the title of a section (div - html element)
   if (title_html.parentNode.classList.contains('section')) {
      const section_obj = getSectionObjById(title_html.parentNode.id);
      section_obj.title = title;
   }
   // else it may be the build title - if so save it to build data (array)
   else if (
      title_html.parentNode.id == 'head' &&
      title_html.value != 'Skill Selection'
   )
      BUILD_DATA.title = title;

   // find font size to use - head or section
   let font = 'Alegreya Sans SC';
   if (title_html.parentNode == HEAD_HTML) font = '60px ' + font;
   else font = '35px ' + font;

   // resize element to fit title
   title_html.style.width = getTextWidth(title, font) + 'px';

   /**
    * Formats a given title so that all words in the title have exactly one space
    * between them and start with a capitalized letter. Also removes extra space
    * at start and end of the title. (e.g. 'nice  to have ' -> 'Nice To Have')
    *
    * @param {String} title The unformatted title.
    * @returns {String} The formatted title.
    */
   function formatTitle(title) {
      // remove extra space and uncapitalize
      title = title.trim().toLowerCase();
      // split all words in title
      const words = title.split(/\s+/);
      // rejoin all words with exactly one space
      // inbetween and capitalized first letter
      title = words.reduce((title, word) => {
         return title + capFirstLetter(word) + ' ';
      }, '');
      return title.trim();
   }

   /**
    * Capitalizes the first letter of a given word.
    *
    * @param {String} word The word to capitalized first letter.
    * @returns {String} The word with first letter capitalized.
    */
   function capFirstLetter(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
   }

   /**
    * Computes and returns the width of a given
    * text of given font in pixels rounded up.
    *
    * @param {String} text The text to be rendered.
    * @param {String} font The css font descriptor.
    */
   function getTextWidth(text, font) {
      // create 2d canvas and set font
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = font;
      // use canvas context to measure given text
      const metrics = context.measureText(text);
      return Math.ceil(metrics.width);
   }
}

/**
 * Creates a section (div - html element) based on given section object (title and skills
 * will be loaded). Adds section (div - html element) to body (div - html element) and the
 * section object to build data (array) if it was a NEW section (basicly loading build).
 *
 * @param {Object} section_obj
 *    The section data object that describes the section to load.
 */
function loadSection(section_obj) {
   // create object copy to not mess with
   // section data presets (e.g. NEW_SECTION_OBJ)
   section_obj = { ...section_obj };

   // create div (html element) and add section class
   const section_html = document.createElement('div');
   section_html.classList.add('section');

   // set up section inner html
   section_html.innerHTML = SECTION_INNER_HTML;

   // setup skill grid (div - html element)
   const skill_grid_html = section_html.querySelector('.skill-grid');
   setupSkillGrid(skill_grid_html);

   // if section is new create unique id from title and add it to
   // section (html and obj) - also add section (obj) to build data
   if (sectionIsNew(section_obj.id)) {
      section_obj.id = createUniqueIdFromTitle(section_obj.title);
      BUILD_DATA.sections.push(section_obj);
   }

   // else use the id of the given section (obj)
   section_html.id = section_obj.id;

   // set up section title (input - html element) - title setup has to be after
   // id setup because updateTitle needs to have a id on the given html element
   // if it is a section in order to update the section object in build data (array)
   section_title_html = section_html.querySelector('.title');
   section_title_html.value = section_obj.title;
   updateTitle(section_title_html);

   // load all skills that should be in the section (div - html element)
   // according to the section object in build data (array)
   for (const skill_obj of section_obj.skills) {
      // find proper skill settings
      let skill_settings = BUILD_RARITY_SETTINGS;
      if (['MIR', 'HEA'].includes(skill_obj.id.slice(0, 3)))
         skill_settings = BUILD_RANK_SETTINGS;

      // create and append skill (html)
      const skill_html = createSkillHtml(skill_obj.id, skill_settings);
      skill_grid_html.append(skill_html);
   }

   // position the section according to its data object in build data
   section_html.style.left = section_obj.position.x + 'px';
   section_html.style.top = section_obj.position.y + 'px';

   // move new sections a little bit to not stack all of them at one place
   if (section_obj.new != -1) {
      const offset = (x, y) => {
         section_html.moveX(x);
         section_html.moveY(y);
      };
      // use .new property to calculate how much offset should be added
      while (section_obj.new-- > 0) offset(60, 60);
      NEW_SECTION_OBJ.new = ++NEW_SECTION_OBJ.new % 3;
   }

   // resizes the section (html) to have exactly the number
   // of columns as saved in the section data object
   resizeSection();

   // setup resizer (div - html element)
   setupResizer();

   // setup mover (div - html element)
   setupMover();

   // put section on top
   putSectionOnTop(section_html);

   // append section (div - html element) to body (div - html element)
   BODY_HTML.appendChild(section_html);

   /**
    * Resizes the section (div - html element) according to the number of columns in
    * the section object saved in build data. The number of rows can be calculated
    * knowing the number of columns and the number of skills of the section.
    *
    * Similar calculations are made in snapSectionToGridSize(), but it is not possible
    * to use this function here because it only works if a section (html) is already
    * appended to the document.
    *
    * One could first append the section and then call snapSectionToGridSize() but it
    * would still be needed to first manually set the proper width for the section.
    *
    * Therefore and because I want to first set everything up and only then append a section
    * (html) to the document I decided to write this function. Also snapSectionToGridSize()
    * would calculate and set the section width again, which is unnecessary.
    */
   function resizeSection() {
      // get the number of columns the section (html) should
      // have from section object and size it accordingly
      section_html.style.width =
         section_obj.columns * ACTUAL_SKILL_WIDTH +
         (section_obj.columns + 1) * GENERAL_MARGIN +
         'px';

      // calc the number of rows the section must have knowing it has
      // the above number of columns and how many skills there are in it
      let num_rows_in_section = Math.ceil(
         section_obj.skills.length / section_obj.columns
      );

      // make sure there are never 0 rows - in that case set it to 1
      num_rows_in_section = num_rows_in_section > 0 ? num_rows_in_section : 1;

      // size the section (html) according to the above calculation
      section_html.style.height =
         num_rows_in_section * ACTUAL_SKILL_HEIGHT +
         (num_rows_in_section + 2) * GENERAL_MARGIN +
         'px';
   }

   /**
    * Sets up the resizer element (html) in the bottom right corner of the section to
    * allow resizing and snapping to skill grid (div - html) sizes (e.g. 3 cols 2 rows).
    */
   function setupResizer() {
      // get resizer (div - html) and add event lisener to it
      const resizer_html = section_html.querySelector('.resizer');
      resizer_html.addEventListener('mousedown', (event) => {
         // should only work with left click
         if (event.button == 0) mousedown(event);
      });

      /**
       * Gets called whenever the user presses the mouse down on top of a resizer element.
       * Sets up event liseners on the window in order to track mouse movement for resizing.
       *
       * @param {Object} event The event given by the event lisener.
       */
      function mousedown(event) {
         // show current section (html) on top of all other ones
         putSectionOnTop(section_html);

         // get the mouse position when the user first clicked the resizer
         let previous_mouse_x = event.clientX;
         let previous_mouse_y = event.clientY;

         // add event liseners to window to further track mouse movement and for resizing
         window.addEventListener('mousemove', mousemove);
         window.addEventListener('mouseup', mouseup);

         /**
          * Gets called whenever the user moves the mouse over the window AFTER he
          * has pressed down the mouse on the resizer element of a section. Handels
          * the actual calculations to be made for resizing and resizing itself.
          *
          * @param {Object} event The event given by the event lisener.
          */
         function mousemove(event) {
            // use this to get the size of the section (div - html)
            const section_rect = section_html.getBoundingClientRect();
            const section_width = Math.ceil(section_rect.width);
            const section_height = Math.ceil(section_rect.height);

            // calculate mouse distance travelled on x and
            // y axis since last time mousemove was called
            const delta_x = event.clientX - previous_mouse_x;
            const delta_y = event.clientY - previous_mouse_y;

            // calculate new section width and height
            let new_section_width = section_width + delta_x;
            let new_section_height = section_height + delta_y;

            // calculate minimum section (div - html) width and height
            const min_section_width = ACTUAL_SKILL_WIDTH + 2 * GENERAL_MARGIN;
            const min_section_height = ACTUAL_SKILL_HEIGHT + 3 * GENERAL_MARGIN;

            // check for min width and heigth if new values
            // are below, set them to their respective minimum
            if (new_section_width < min_section_width)
               new_section_width = min_section_width;
            if (new_section_height < min_section_height)
               new_section_height = min_section_height;

            // actually resize the section now (-2*2px border)
            section_html.style.width = new_section_width - 4 + 'px';
            section_html.style.height = new_section_height - 4 + 'px';

            // save current mouse position for next time
            previous_mouse_x = event.clientX;
            previous_mouse_y = event.clientY;
         }

         /**
          * Gets called whenever the user stops pressing the mouse over the window AFTER he
          * has pressed down the mouse on the resizer (div - html) element of a section (div
          * - html). Removes all in mousedown() set event liseners from window and snaps
          * section (div - html) to its current skill grid (div - html) layout.
          */
         function mouseup() {
            // remove all in mousedown set event liseners from window
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);

            // snap section (div - html) to its current skill grid (div - html) layout
            snapSectionToGridSize(section_html);
         }
      }
   }

   /**
    * Sets up the mover element (html) at the top of the section to allow moving it and
    * automaticly positioning the section to fit nicely within all the other ones.
    */
   function setupMover() {
      // get mover (div - html) and add event lisener to it
      const mover_html = section_html.querySelector('.mover');
      mover_html.addEventListener('mousedown', (event) => {
         // should only work with left click
         if (event.button == 0) mousedown(event);
      });

      /**
       * Gets called whenever the user presses the mouse down on top of a mover element.
       * Sets up event liseners on the window in order to track mouse movement for moving.
       *
       * @param {Object} event The event given by the event lisener.
       */
      function mousedown(event) {
         // add 'moving' class to section (to change cursor)
         section_html.classList.add('moving');

         // show current section (html) on top of all other ones
         putSectionOnTop(section_html);

         // get the mouse position when the user first clicked the mover
         let old_mouse_x = event.clientX;
         let old_mouse_y = event.clientY;

         // add event liseners to window to further track mouse movment and for moving
         window.addEventListener('mousemove', mousemove);
         window.addEventListener('mouseup', mouseup);

         /**
          * Gets called whenever the user moves the mouse over the window AFTER he
          * has pressed down the mouse on the mover element of a section. Handels
          * the actual calculations to be made for moving and moving itself.
          *
          * @param {Object} event The event given by the event lisener.
          */
         function mousemove(event) {
            // get current mouse position
            const new_mouse_x = event.clientX;
            const new_mouse_y = event.clientY;

            // calculate mouse distance travelled on x and
            // y axis since last time mousemove was called
            const delta_x = new_mouse_x - old_mouse_x;
            const delta_y = new_mouse_y - old_mouse_y;

            // move the section (div - html)
            section_html.moveX(delta_x);
            section_html.moveY(delta_y);

            // save current mouse position for next time
            old_mouse_x = new_mouse_x;
            old_mouse_y = new_mouse_y;
         }

         /**
          * Gets called whenever the user stops pressing the mouse over the window AFTER he
          * has pressed down the mouse on the mover (div - html) element of a section (div
          * - html). Removes all in mousedown() set event liseners from window and positions
          * section (div - html) to fit nicely within all the other sections.
          */
         function mouseup() {
            // remove moving class to section (to change cursor)
            section_html.classList.remove('moving');

            // remove all in mousedown set event liseners from window
            window.removeEventListener('mousemove', mousemove);
            window.removeEventListener('mouseup', mouseup);

            // save position of the section (html) to section object in build data
            getSectionObjById(section_html.id).position = {
               x: section_html.offsetLeft,
               y: section_html.offsetTop,
            };
         }
      }
   }

   /**
    * Goes through build data array and looks for section with given id.
    * Will return boolean whether a section with that id exists or not.
    *
    * @param {String} section_id The section id to look for.
    * @returns {Boolean} Whether a section with that id exists or not.
    */
   function sectionIsNew(section_id) {
      // go through all section (obj) in build data (array)
      // check if any one of them has the given id, if so return false
      for (const section_obj of BUILD_DATA.sections)
         if (section_obj.id == section_id) return false;

      // if the code reaches here no section (obj) has
      // the given id therefore just return true
      return true;
   }

   /**
    * Creates and returns an unique id from a section title. A id generated
    * by this function will never be the same as the id of any existing section.
    *
    * @param {String} title The title of the section.
    * @returns {String} The unique id generated from the given title.
    */
   function createUniqueIdFromTitle(section_title) {
      // create hash code from title
      let hash_code = section_title.hashCode();

      // check if any section (obj - data array) already uses this hash
      // code as id and if so just rehash until a unique id has been found
      while (sectionIdisNotUnique(hash_code)) hash_code = hash_code.hashCode();

      return hash_code;

      /**
       * Checks and returns whether any section
       * (obj - data array) already uses the given id.
       *
       * @param {String} id The id to check.
       * @returns {Boolean}
       *    Whether the given id is already in use by any section or not.
       */
      function sectionIdisNotUnique(section_id) {
         for (section of BUILD_DATA.sections)
            if (section.id == section_id) return true;
         // if the code reaches this spot all sections have diffrent ids
         return false;
      }
   }
}

/**
 * Positions all the sections to fit nicley between each other. Adds gaps
 * between them and undos overlaps. Can take up to a second to execute! Also
 * resets the offsets all sections have been given by the user (by moving).
 */
function positionSectionsToFit() {
   /**
    * Getting this number right massivly impacts the runtime of the
    * entire positionSectionsToFit() function. See staircaseMove().
    *
    * Making the steps bigger results in way less overlap checks on
    * the way to the left and up, but also results in a potentialy
    * bigger overlap at the end, that HAS TO be gone back pixel by
    * pixel creating a bunch of new checks to be made.
    *
    * Making the steps smaller would reduce that risk, however it would
    * take more checks in the first place (on the way left and up).
    *
    * Therefore one can ask what would be the optimal step size to minimize
    * the number of ALL CHECKS.
    *
    * I did some rough math and it seems to be somewhere between 50-150px
    * depending on screen size (or how much the user has zoomed in/out).
    * With inverse (1/x) scaling left of the minimum and linear scaling (x)
    * right of the minimum. Therefore it should be better choosing a value
    * bigger then smaller if there are two good ones.
    *
    * Testing diffrent values in that range reduced it further to something
    * between 80 and 120. So I went with 110, which gave me a average runtime
    * of about 450ms (zoomed out to 25% with 5 medium to large sections of
    * diffrent proportions put randomly in the bottom right corner of the
    * screen at 1440p). So basicly fitting all sections should never take
    * more then a hot second.
    */
   const OPTIMAL_STEP_SIZE = 110;

   // get all sections and proceed if there are more then zero
   const sections_html = BODY_HTML.querySelectorAll('.section');
   if (sections_html.length == 0) return;

   // calculate the offsets by which all sections are displaced by the user
   let offset_x = Number.POSITIVE_INFINITY;
   let offset_y = Number.POSITIVE_INFINITY;
   for (const section_html of sections_html) {
      offset_x =
         offset_x < section_html.getX() ? offset_x : section_html.getX();
      offset_y =
         offset_y < section_html.getY() ? offset_y : section_html.getY();
   }

   // move all sections (html) to the top left corner
   for (const section_html of sections_html) {
      section_html.moveX(SECTION_GAP - offset_x);
      section_html.moveY(SECTION_GAP - offset_y);
   }

   // get all sections (html) in their order from the origin {0,0}
   const ordered_sections = orderSections(sections_html);

   // for each of the sections in that order position them correctly
   for (const ordered_section of ordered_sections) {
      // if the currend section has overlap before moving handel it
      if (anySectionOverlapWith(ordered_section)) {
         // get the index of the current section
         const curr_index = ordered_sections.indexOf(ordered_section);

         // get all sections that has already been positioned
         const sections_up_left = [...ordered_sections];
         sections_up_left.splice(curr_index);

         // get all sections that will be positioned after the current one
         const sections_down_right = [...ordered_sections].splice(
            curr_index + 1
         );

         // move all sections down right AND current one to the bottom right
         // until the current one does not overlap with any up left
         while (anySectionOverlapWith(ordered_section, sections_up_left))
            for (const section_down_right of [
               ordered_section,
               ...sections_down_right,
            ]) {
               ordered_section.moveX(OPTIMAL_STEP_SIZE);
               ordered_section.moveY(OPTIMAL_STEP_SIZE);
            }

         // move all sections down right to the bottom right
         // until there is no overlap with the current one
         while (anySectionOverlapWith(ordered_section, sections_down_right))
            for (const section_down_right of sections_down_right) {
               section_down_right.moveX(OPTIMAL_STEP_SIZE);
               section_down_right.moveY(OPTIMAL_STEP_SIZE);
            }
      }

      // move the section in a staircase pattern (left - up - ...) until
      // its in a top left corner and therefore cant be moved any further
      while (!isInTopLeftCorner(ordered_section))
         staircaseMove(ordered_section);

      // add gaps to the left and top side of the section (html)
      ordered_section.moveX(SECTION_GAP);
      ordered_section.moveY(SECTION_GAP);

      // save position of the section (html) to section object in build data
      const section_obj = getSectionObjById(ordered_section.id);
      section_obj.position = {
         x: ordered_section.offsetLeft,
         y: ordered_section.offsetTop,
      };
   }

   /**
    * Moves a given section (html element) one 'staircase'. This means
    * the section will be pushed FIRST as far LEFT as possible and THEN
    * as far UP as possible.
    *
    * @param {Object} section_html The section (html element) to move.
    */
   function staircaseMove(section_html) {
      // move section left until its overlapping
      while (!anySectionOverlapWith(section_html))
         section_html.moveX(-OPTIMAL_STEP_SIZE);
      // move section back right until its not overlapping
      while (anySectionOverlapWith(section_html)) section_html.moveX(1);

      // move section up until its overlapping
      while (!anySectionOverlapWith(section_html))
         section_html.moveY(-OPTIMAL_STEP_SIZE);
      // move section back down until its not overlapping
      while (anySectionOverlapWith(section_html)) section_html.moveY(1);
   }

   /**
    * Checks and returns if a section (html) is in a top left corner.
    * More precise: checks whether the section can be moved any further
    * to the left or any further to the top. Includes build area borders.
    *
    * @param {Object} section_html The section (html) to check.
    * @returns {Boolean}
    *    Whether the section has reached a top left corner or not.
    */
   function isInTopLeftCorner(section_html) {
      // check if the section (html) can be moved further to the left
      section_html.moveX(-1);
      const left_blocked = anySectionOverlapWith(section_html);
      section_html.moveX(1);

      // check if the section (html) can be moved further to the top
      section_html.moveY(-1);
      const top_blocked = anySectionOverlapWith(section_html);
      section_html.moveY(1);

      // a section is in a top left corner if it cant
      // be moved any further to the left or the top
      return left_blocked && top_blocked;
   }

   /**
    * Checks and returns whether the given section (html) overlaps with any of
    * the other ones on the build page or whether it is outside the build area.
    *
    * @param {Object} section_html The section to check overlap with.
    * @returns {Boolean}
    *    Whether the given section overlaps with any of the other ones.
    */
   function anySectionOverlapWith(section_html, overlap_sections) {
      // get all other sections (html)
      const other_sections =
         overlap_sections || getAllSectionsExcept(section_html);

      // check if given section (html) overlaps with any of the other ones
      for (const other_section of other_sections)
         if (twoSectionOverlap(section_html, other_section)) return true;

      // if the code reaches here the only overlap that could still
      // be true are the top and left borders of the build area
      return !(section_html.offsetLeft > 0) || !(section_html.offsetTop > 0);

      /**
       * Checks and returns whether the two given sections (html) overlap.
       *
       * @param {Object} section1_html The first section (html) to check.
       * @param {Object} section2_html The second section (html) to check.
       * @returns {Boolean} Whether the two sections (html) overlap.
       */
      function twoSectionOverlap(section1_html, section2_html) {
         // get section rectangles
         const rect1 = section1_html.getBoundingClientRect();
         const rect2 = section2_html.getBoundingClientRect();

         // if one or more expressions in the parenthese are true, there
         // is no overlap - if all are false, there must be an overlap
         return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
         );
      }
   }

   /**
    * Gets, orders, and returns all sections (html). Orders by the distance
    * from the top left corner of a section to the origin. Lowest first.
    *
    * @param {Array} sections_html The sections (html) to order.
    * @returns {Array} The sections (html) ordered in an array.
    */
   function orderSections(sections_html) {
      // the top left corner of a section (html) as object {x,y}
      const section_corner = (section_html) => {
         const section_rect = section_html.getBoundingClientRect();
         return {
            x: section_rect.left,
            y: section_rect.top,
         };
      };

      // the distance from the section_corner to the origin {0,0}
      // (pythagorean theorem) with accounted scroll offsets
      const distance_origin = (section_corner) => {
         return Math.sqrt(
            Math.pow(section_corner.x, 2) + Math.pow(section_corner.y, 2)
         );
      };

      // for each section calculate the distance to the origin and save it
      let sect_with_dist = [];
      for (const section_html of sections_html)
         sect_with_dist.push({
            sect: section_html,
            dist: distance_origin(section_corner(section_html)),
         });

      // order the sections within sect_with_dist by their distances
      bubbleSort(sect_with_dist);

      // return only the sections (html)
      return sect_with_dist.reduce((only_sect, curr_sect_with_dist) => {
         only_sect.push(curr_sect_with_dist.sect);
         return only_sect;
      }, []);

      /**
       * Bubble sort implementation for sect_with_dist. Sorts the objects
       * by their dist property. Worst case runtime is O(n^2), which is
       * perfectly fine for this project (number of sections = n < 50).
       *
       * @param {Object} sect_with_dist
       *    The array with the {section, distance} objects.
       */
      function bubbleSort(sect_with_dist) {
         // after each itteration of the outer loop the one more
         // element at the end of the array will be sorted
         for (
            let elements_sorted = 0;
            elements_sorted < sect_with_dist.length;
            elements_sorted++
         )
            // for each of the remaining unsorted elements in the front of the
            // array, compare it with its neighbour and swap if wrong order
            for (
               let index = 0;
               index < sect_with_dist.length - elements_sorted - 1;
               index++
            )
               // compare and swap if needed
               if (sect_with_dist[index].dist > sect_with_dist[index + 1].dist)
                  swapElementsAt(index, index + 1);

         /**
          * Swaps the elements of sect_with_dist at the given indexes.
          *
          * @param {Number} n The index of the first element.
          * @param {Number} m The index of the second element.
          */
         function swapElementsAt(n, m) {
            // save element at index n to be able to override it
            const temp = sect_with_dist[n];

            // swap element by using temp variable above
            sect_with_dist[n] = sect_with_dist[m];
            sect_with_dist[m] = temp;
         }
      }
   }
}

/**
 * Adds 'on-top' class to given section (html) and removes it
 * from all other sections that have it. Effectively putting
 * it on top off all other ones through css.
 *
 * @param {Object} section_html The section (html) to be put on top.
 */
function putSectionOnTop(section_html) {
   // get all other sections (html) except given one
   const other_sections = getAllSectionsExcept(section_html);

   // remove 'on-top' class from all other sections
   for (const other_section of other_sections)
      if (other_section.classList.contains('on-top'))
         other_section.classList.remove('on-top');

   // add 'on-top' class to given section
   section_html.classList.add('on-top');
}

/**
 * Finds and returns all other sections (html) then the given one.
 *
 * @param {Object} section_html The section (html) to exclude.
 * @returns {NodeList} All the other sections (html) then the given one.
 */
function getAllSectionsExcept(section_html) {
   // add 'no-select' class to given section
   section_html.classList.add('no-select');

   // use this class to get all other sections
   const other_sections = BODY_HTML.querySelectorAll(
      '.section:not(.no-select)'
   );

   // remove 'no-select' class from given section
   section_html.classList.remove('no-select');

   return other_sections;
}

/**
 * Snaps the border of a given section (div - html) around the current layout of
 * its skill grid (div - html). Allows the user to freely resize sections (html)
 * and have them snap back to fit their skill grids (html) automaticly. Gets called
 * whenever the user ends a resize of a section.
 *
 * @param {Object} section_html The section which border is to be snaped.
 */
function snapSectionToGridSize(section_html) {
   // get the skill grid (div - html) of the section (div - html) and its bounding box
   const skill_grid_html = section_html.querySelector('.skill-grid');
   const skill_grid_box = skill_grid_html.getBoundingClientRect();

   // snap the section (div - html) height to skill grid (div - html) height plus margins
   const new_section_height = Math.ceil(
      skill_grid_box.height + 3 * GENERAL_MARGIN
   );
   section_html.style.height = new_section_height + 'px';

   // unfortunately snaping the section (div - html) width is not as easy, because
   // the skill grid (div - html) box always takes up 100% of the section width

   // get the number of skills in the section (html) particularly in the skill grid
   // and the max number of skills per row at the current skill grid (html) width
   const num_of_skills = skill_grid_html.childNodes.length;
   let max_skills_per_row = calcMaxSkillsPerRow(
      Math.ceil(skill_grid_box.width)
   );

   // do not make the rows wider then there are skills (html) in the section
   // (html) but also not narrower than the space one skill (html) does need
   // to achive this max_skills_per_row should be 1 if num_of_skills is 0
   if (max_skills_per_row > num_of_skills)
      max_skills_per_row = num_of_skills > 0 ? num_of_skills : 1;

   // at this point max_skills_per_row is effectifly the number of columns
   // of the section (html) therefore we save it to the section object
   getSectionObjById(section_html.id).columns = max_skills_per_row;

   // snap the section (div - html) width to skill grid (div - html) width plus margins
   // for n objects there are (n-1) spaces between and 2 spaces extra (start and end)
   const new_section_width = Math.ceil(
      max_skills_per_row * ACTUAL_SKILL_WIDTH +
         (max_skills_per_row + 1) * GENERAL_MARGIN
   );
   section_html.style.width = new_section_width + 'px';

   /**
    * Finds and returns the number of skills that would fit in
    * a skill grid (div - html) with given maximum row width.
    *
    * @param {Number} max_row_width The maximum row width.
    */
   function calcMaxSkillsPerRow(max_row_width) {
      let max_skills_per_row = 0;

      // start with the width of one skill (html) and add further ones
      // until the maximum row width is exceeded - at that point return
      for (
         let row_width = ACTUAL_SKILL_WIDTH;
         row_width <= max_row_width;
         max_skills_per_row++
      )
         // for each further skill (html) there will also be gap
         row_width += ACTUAL_SKILL_WIDTH + GENERAL_MARGIN;

      return max_skills_per_row;
   }
}

/**
 * Sets up needed event liseners on given skill grid (div
 * - html element) to enable drag and drop functionallity.
 * @param {Object} skill_grid_html
 *    The skill grid (div - html element) to setup.
 */
function setupSkillGrid(skill_grid_html) {
   // add event lisener - all functionallity is handeled below
   skill_grid_html.addEventListener('dragover', dragover);

   /**
    * Gets called whenever a skill (div - html element) is draged over
    * this skill grid. Adds it to the grid. Works with empty grids.
    *
    * @param {Object} event The event given by the event lisener.
    */
   function dragover(event) {
      // remove ugly default cursor
      event.preventDefault();

      // get dragged skill (div - html element)
      const dragged_skill_html = document.querySelector('.dragging');

      // check if skill grid (div - html element) is empty
      if (skill_grid_html.childNodes.length == 0) {
         // if so just append the skill (div - html element) and return
         skill_grid_html.appendChild(dragged_skill_html);
         return;
      }

      // get skill (div - html element) the mouse is currently over
      const skill_mouse_over_html = getSkillMouseOverHtml(
         event.clientX,
         event.clientY
      );

      // if mouse isnt over any skill (div - html element)
      // or the one that is draged do nothing
      if (
         skill_mouse_over_html == null ||
         skill_mouse_over_html == dragged_skill_html
      )
         return;

      // if the mouse is over a skill (div - html element) insert it at that place
      if (skillIsAfter(dragged_skill_html, skill_mouse_over_html)) {
         // dragged skill (div - html element) is after mouse over
         // skill (div - html element) insert before to let them switch
         skill_grid_html.insertBefore(
            dragged_skill_html,
            skill_mouse_over_html
         );
      } else {
         // dragged skill (div - html element) is after mouse over
         // skill (div - html element) insert before to let them switch
         // this is a workaround for the lack of a insertAfter function
         skill_grid_html.insertBefore(
            dragged_skill_html,
            skill_mouse_over_html.nextSibling
         );

         // show current section (the one with this skillgrid) on top of all other ones
         putSectionOnTop(skill_grid_html.parent(2));

         // if on build page resnap all sections (div - html element)
         if (HEAD_HTML.firstElementChild.innerText != 'Skill Selection')
            for (const section_html of BODY_HTML.childNodes)
               snapSectionToGridSize(section_html);
      }
   }

   /**
    * Checks and returns over which skill (div - html element)
    * the mouse currently is. Can return null!
    *
    * @param {Number} mouseX The x coordinate of the mouse.
    * @param {Number} mouseY The y coordinate of the mouse.
    * @returns {Object}
    *    The skill (div - html element) the mouse is over.
    *    Or null if the mouse is not over any skill.
    */
   function getSkillMouseOverHtml(mouseX, mouseY) {
      // get all skills (div - html element) on current skill grid
      const skills_on_gird_html = skill_grid_html.querySelectorAll('.skill');

      // check if the mouse is on any one of them
      for (const skill_html of skills_on_gird_html) {
         const skill_box = skill_html.getBoundingClientRect();
         if (
            // if the mouse is between the left and right border of
            // a skill (div - html element) as well as between the top
            // and bottom one, it is on the skill (div - html element)
            mouseX.between(skill_box.left, skill_box.right) &&
            mouseY.between(skill_box.top, skill_box.bottom)
         )
            return skill_html;
      }
   }

   /**
    * Checks whether a skill (div - html element) is after another fixed
    * skill (div - html element) on current skill grid (div - html element).
    *
    * @param {Object} ckeck_skill_html The skill (div - html element) to check.
    * @param {Object} fixed_skill_html The fixed skill (div - html element).
    * @returns {Boolean}
    *    Whether the ckeck skill (div - html element) is after
    *    the fixed skill (div - html element).
    */
   function skillIsAfter(ckeck_skill_html, fixed_skill_html) {
      // get all skills (div - html element) on current skill grid as array
      let skills_on_gird_html = [...skill_grid_html.querySelectorAll('.skill')];

      // check for order using Array.indexOf
      return (
         skills_on_gird_html.indexOf(ckeck_skill_html) >
         skills_on_gird_html.indexOf(fixed_skill_html)
      );
   }
}

/**
 * Deletes a existing section (div - html element) from the body (div - html
 * element). Also deletes the section object from the build data (array).
 *
 * @param {Object} section_html The section html div element to delete.
 */
function deleteSection(section_html) {
   // remove section from body
   BODY_HTML.removeChild(section_html);

   // update build data to match whats on screen
   updateBuildData();
}

/**
 * Creates and returns a skill (div - html element) based on given id or skill data (object).
 * Uses Settings to set drag and click behaviour. TODO: example settings
 *
 * @param {String or Object} skill_info The id or data of the skill.
 * @param {Object} skill_settings The Object containing all settings.
 * @returns {Object} The skill as a div (html element).
 */
function createSkillHtml(skill_info, skill_settings) {
   let skill_data;
   // check if skill info (input) is skill id (string) or skill data (object)
   if (typeof skill_info == 'string') skill_data = getSkillData(skill_info);
   else skill_data = skill_info;

   // add deletable boolean to skill data (this is for SKILL_INNER_HTML(skill_data))
   skill_data.deletable = skill_settings.deletable;

   // create div (html element) and set draggable and id
   const skill_html = document.createElement('div');
   skill_html.draggable = skill_settings.draggable;
   skill_html.id = skill_data.id;

   // add 'skill' or 'mini-skill' class to the skill (html)
   if (skill_settings.mini_skill) skill_html.classList.add('mini-skill');
   else skill_html.classList.add('skill');

   // add classes or data for classes (rank, rarity)
   if (skill_data.id.slice(-1) == 'L') skill_html.classList.add('legendary');
   else if (skill_data.id.slice(-1) == 'H') skill_html.classList.add('hammer');
   else if (skill_data.id.slice(0, 3) == 'DUO') skill_html.classList.add('duo');
   else if (['MIR', 'HEA'].includes(skill_data.id.slice(0, 3)))
      skill_data.rank = 1;
   else skill_data.rarity = 'common';

   // if the current skill is a build skill get skill build data
   // this will override the above set data for classes (rank, rarity)
   if (
      skill_settings == BUILD_RANK_SETTINGS ||
      skill_settings == BUILD_RARITY_SETTINGS
   )
      skill_data = { ...skill_data, ...getSkillBuildData(skill_data.id) };

   // add rank and rarity classes if defined
   if (skill_data.rank != undefined)
      skill_html.classList.add('rank' + skill_data.rank);
   if (skill_data.rarity != undefined)
      skill_html.classList.add(skill_data.rarity);

   // set up skill (div - html element) html
   skill_html.innerHTML = SKILL_INNER_HTML(skill_data);

   // set up event liseners for drag behaviour
   if (skill_settings.draggable) {
      skill_html.addEventListener('dragstart', dragstart);
      skill_html.addEventListener('dragend', dragend);
   }

   // set up event liseners for click behaviour
   switch (skill_settings.onclick) {
      case 'show skill details':
         skill_html.addEventListener('click', showSkillDetails);
         break;
      case 'change rarity':
         skill_html.addEventListener('click', changeRarity);
         break;
      case 'change rank':
         skill_html.addEventListener('click', changeRank);
         break;
      case 'add to cache':
         skill_html.addEventListener('click', addToCache);
         break;
   }

   // set up event liseners for right click behaviour
   switch (skill_settings.onrightclick) {
      case 'show skill details':
         skill_html.addEventListener('contextmenu', showSkillDetails);
         break;
      case 'change rarity':
         skill_html.addEventListener('contextmenu', changeRarity);
         break;
      case 'change rank':
         skill_html.addEventListener('contextmenu', changeRank);
         break;
      case 'add to cache':
         skill_html.addEventListener('contextmenu', addToCache);
         break;
   }

   // return fully set up skill (div - html element)
   return skill_html;

   /**
    * Gets called whenever the user rightclickes on a skill with propper settings.
    * Loads up the sidebar and shows additional information as well as requirements
    * of the skill the user rightclicked on.
    *
    * @param {Object} event The event object given by the event handler.
    */
   function showSkillDetails(event) {
      // prevents right click menu from showing up
      event.preventDefault();

      // get and clear info content (div - html)
      const info_content_html = INFO_HTML().querySelector('.content');
      info_content_html.innerHTML = '';

      // find proper skill settings
      let skill_settings = INFO_RARITY_SETTINGS;
      if (['MIR', 'HEA'].includes(skill_data.id.slice(0, 3)))
         skill_settings = INFO_RANK_SETTINGS;

      // create and append info skill (div - html) to info segment
      const info_skill_html = createSkillHtml(skill_data, skill_settings);
      info_skill_html.classList.add('info');
      info_content_html.appendChild(info_skill_html);

      // create and append info title (p - html) object
      const info_title_html = document.createElement('p');
      info_title_html.classList.add('segment-title');

      // if there are no information say so else print them
      if (skill_data.info.length == 0)
         info_title_html.innerText = 'No Additional Information.';
      else info_title_html.innerText = 'Additional Information:';

      // append info title (p - html) to info segment
      info_content_html.appendChild(info_title_html);

      // add pomable info if it is a boon skill
      const information = [...skill_data.info];
      if (skill_data.pomable != undefined)
         if (skill_data.pomable)
            information.push('This <bold>Boon</bold> is pomable.');
         else
            information.push(
               'This <bold>Boon</bold> is <bold>not</bold> pomable.'
            );

      // add all information to the info segment
      for (const info of information) {
         const info_html = document.createElement('p');
         info_html.innerHTML = '&rtrif; ' + info;
         info_content_html.appendChild(info_html);
      }

      // if there are no requirements say so else print them
      if (skill_data.requirements.length == 0) {
         const requir_title_html = document.createElement('p');
         requir_title_html.classList.add('segment-title');
         requir_title_html.innerText = 'No Requirements Needed.';
         info_content_html.appendChild(requir_title_html);
      }

      // add all requirement groups with a title to info segment
      for (const requir_group of skill_data.requirements) {
         // create and add requirement group title (p - html)
         const group_title_html = document.createElement('p');
         group_title_html.classList.add('segment-title');
         if (skill_data.requires_two || false)
            group_title_html.innerText = 'Requires Two Of These:';
         else group_title_html.innerText = 'Requires One Of These:';
         info_content_html.appendChild(group_title_html);

         // create requirement grid (div - html)
         const requir_grid_html = document.createElement('div');
         requir_grid_html.classList.add('mini-skill-grid');

         // add required skills to the grid
         for (const skill_id of requir_group) {
            const requir_skill_html = createSkillHtml(
               skill_id,
               MINI_SKILL_SETTINGS
            );
            requir_grid_html.appendChild(requir_skill_html);
         }

         // add requirement grid to info segment
         info_content_html.appendChild(requir_grid_html);
      }

      // if sidebar is not open do it automatically
      if (SIDE_HTML.classList.contains('hidden')) toggleSideBar();
   }

   /**
    * Gets called whenever a skill (div - html element) with
    * skill_settings.onclick = 'add to cache' gets clicked.
    *
    * Creates and adds a new instance of the skill (div - html element)
    * and adds it to the skill cache (skill grid - div - html element).
    * Also adds 1 to the number in the cache title (p - html element).
    */
   function addToCache() {
      // get cache grid (div - html element)
      const cache_grid_html = CACHE_HTML().querySelector('.skill-grid');

      // find proper skill settings
      let skill_settings = CACHE_RARITY_SETTINGS;
      if (['MIR', 'HEA'].includes(skill_data.id.slice(0, 3)))
         skill_settings = CACHE_RANK_SETTINGS;

      // create and add skill (div - html element) to it
      const skill_html = createSkillHtml(skill_data, skill_settings);
      if (cache_grid_html.firstChild != null)
         cache_grid_html.insertBefore(skill_html, cache_grid_html.firstChild);
      else cache_grid_html.appendChild(skill_html);
   }

   /**
    * Gets called whenever the user clicks on a skill with that callback.
    * Changes the rarity of the skill to the next level and updates its effect.
    */
   function changeRarity() {
      // get max rarity (number) of the skill
      const max_rarity = skill_data.effect.length;

      // if a skill has only one rarity or is about to be deleted return
      if (max_rarity < 2 || skill_html.parentNode == null) return;

      // create NEW array with all rarities up to max one for that skill
      const rarities = [...SKILL_RARITYS];
      rarities.splice(max_rarity);

      // get a refrence to the class list of the skill (html)
      const class_list = skill_html.classList;

      // check which rarity the skill (html) currently has
      for (const rarity of rarities)
         if (class_list.contains(rarity)) {
            // calculate the index of the next rarity with loop back
            const index = (rarities.indexOf(rarity) + 1) % max_rarity;

            // remove current rarity
            class_list.remove(rarity);

            // add the next rarity level or loop back to common
            class_list.add(rarities[index]);

            // update the effect of the skill (html) and return
            skill_html.querySelector('.effect').innerHTML =
               '&rtrif; ' + skill_data.effect[index];

            // update build data if the skill is in build area
            if (skill_html.parent(4) == BODY_HTML) updateBuildData();

            return;
         }
   }

   /**
    * Gets called whenever the user clicks on a skill with that callback.
    * Changes the rank of the skill to the next level and updates its effect.
    */
   function changeRank() {
      // get max rank of the skill
      let max_rank = skill_data.effect.length;

      // if a skill has only one rank or is about to be deleted return
      if (max_rank < 2 || skill_html.parentNode == null) return;

      // get a refrence to the class list of the skill (html)
      const class_list = skill_html.classList;

      // check which rank the skill (html) currently has
      for (const rank_class of class_list)
         if (rank_class.slice(0, 4) == 'rank') {
            // calculate the number of the next rank with loop back to 1
            let rank = (parseInt(rank_class.slice(4)) + 1) % ++max_rank;
            rank = rank == 0 ? 1 : rank;

            // remove current rank class
            class_list.remove(rank_class);

            // add the next rank level or loop back to rank1
            class_list.add('rank' + rank);

            // update the effect of the skill (html)
            skill_html.querySelector('.effect').innerHTML =
               '&rtrif; ' + skill_data.effect[rank - 1];

            // update the rank of the skill (html)
            let rank_text = skill_html.querySelector('.rank').innerText;
            rank_text = rank + ' /' + rank_text.split('/')[1];
            skill_html.querySelector('.rank').innerText = rank_text;

            // update build data if the skill is in build area
            if (skill_html.parent(4) == BODY_HTML) updateBuildData();

            return;
         }
   }

   /**
    * Gets called whenever a skill drag is started.
    * Sets 'dragging' and 'wait-for-drag' classes.
    */
   function dragstart() {
      // add 'dragging' class to this skill (div - html element)
      skill_html.classList.add('dragging');

      // add 'wait-for-drag' class to all other skills (div - html element)
      const other_skills_html = document.querySelectorAll(
         '.skill:not(.dragging)'
      );
      for (const other_skill_html of other_skills_html)
         other_skill_html.classList.add('wait-for-drag');
   }

   /**
    * Gets called whenever a skill drag is ended.
    * Removes 'dragging' and 'wait-for-drag' classes.
    * Also makes sure that the number of skills in cache
    * (skill grid - div - html element) is shown correctly.
    */
   function dragend() {
      // remove 'wait-for-drag' class from all other skills (div - html element)
      const other_skills_html = document.querySelectorAll(
         '.skill:not(.dragging)'
      );
      for (const other_skill_html of other_skills_html)
         other_skill_html.classList.remove('wait-for-drag');

      // remove 'dragging' class from this skill (div - html)
      skill_html.classList.remove('dragging');

      // if on build page resnap all sections (div - html element)
      if (HEAD_HTML.firstElementChild.innerText != 'Skill Selection')
         for (const section_html of BODY_HTML.childNodes)
            snapSectionToGridSize(section_html);

      // update build data (array) to reflect new skill (div - html) distribution
      if (skill_html.parent(4) == BODY_HTML) updateBuildData();
   }
}

/**
 * Updates build data (array) to match the current distribution of
 * skills (div - html) among all the sections (div - html) in the build.
 * Also deletes section objects if needed.
 */
function updateBuildData() {
   // the info about a skill that can be changed by a user and its id
   const skill_info = (id, rank, rarity) => {
      return {
         id,
         rank,
         rarity,
      };
   };

   // the rank of the given skill (html) as number
   const rank = (skill_html) => {
      const class_list = skill_html.classList;
      // search for rank class and return only the number
      for (const class_name of class_list)
         if (class_name.slice(0, 4) == 'rank')
            return parseInt(class_name.slice(4));
   };

   // the rarity of the given skill (html) as string
   const rarity = (skill_html) => {
      const class_list = skill_html.classList;
      // search for rarity class and return it
      for (const class_name of class_list)
         if (SKILL_RARITYS.includes(class_name)) return class_name;
   };

   // get all sections (div - html) of the build
   const sections_html = BODY_HTML.querySelectorAll('.section');

   // for each section (div - html) update skills
   // array of corresponding section object
   for (const section_html of sections_html) {
      // get skill grid (div - html) of the section (div - html)
      const skill_grid_html = section_html.querySelector('.skill-grid');
      const skills_html = skill_grid_html.childNodes;

      // get section object and reset its skill(-id) array
      const section_obj = getSectionObjById(section_html.id);
      section_obj.skills = [];

      // for each skill (div - html) on the skill grid (div - html)
      // add its id, rank, and rarity to the skill array of the section object
      for (const skill_html of skills_html)
         section_obj.skills.push(
            skill_info(skill_html.id, rank(skill_html), rarity(skill_html))
         );
   }

   // find all sections (ids) which have a object but no html element
   const to_delete = BUILD_DATA.sections.reduce((to_delete, section_obj) => {
      // if there is a html element for the current section object do nothing
      for (const section_html of sections_html)
         if (section_html.id == section_obj.id) return to_delete;

      // if there isnt a html element [...] save its id in to_delete
      to_delete.push(section_obj.id);
      return to_delete;
   }, []);

   // delete all the found sections objects that have no html representation
   for (const section_id of to_delete) deleteSectionObj(section_id);

   /**
    * Removes the section object with given id from the build data array.
    *
    * @param {String} section_id The id of the section object to remove.
    */
   function deleteSectionObj(section_id) {
      // temporary array to store section objects in
      const section_objects = [];

      // go through all sections (obj) in build data (array) and add all of
      // them that do NOT match the given id to the above temporary array
      for (const section_obj of BUILD_DATA.sections)
         if (section_obj.id != section_id) section_objects.push(section_obj);

      // override build data sections
      BUILD_DATA.sections = section_objects;
   }
}

/**
 * Searches through SKILL_DATA (array) for skill data with matching id.
 *
 * @param {String} skill_id The id of the skill (e.g. 'POS02_S').
 * @returns {Object} The object that holds the skill data.
 */
function getSkillData(skill_id) {
   // search through skill data (array)
   for (const category of SKILL_DATA)
      for (const skill_data of category)
         if (skill_data.id == skill_id) return skill_data;
}

/**
 * Searches through BUILD_DATA (array) for skill build data with matching id.
 *
 * @param {String} skill_id
 * @returns {Object}
 */
function getSkillBuildData(skill_id) {
   // search through build data (array)
   for (const section_data of BUILD_DATA.sections)
      for (const skill_data of section_data.skills)
         if (skill_data.id == skill_id) return skill_data;
}

/**
 * Finds and returns section object (from build data array) with given id.
 *
 * @param {String} section_id The id of the section (obj) to get.
 * @returns {Object} The section object with matching id.
 */
function getSectionObjById(section_id) {
   // go through all sections (obj)
   // if any one has the given id return it
   for (const section_obj of BUILD_DATA.sections)
      if (section_obj.id == section_id) return section_obj;
}

/**
 * Returns only the part of the string this is called upon, that comes before
 * a given character (works with strings to). If the character is not part
 * of the string this is called upon, the function will return the full string.
 *
 * @param {String} char The character to get evrything before.
 * @returns {String} Everything before the given character.
 */
String.prototype.stringBefore = function (char) {
   // if char is not part of string return full string
   if (this.indexOf(char) == -1) return this;
   // else return only the part before char
   else return this.split(char)[0];
};

/**
 * Returns only the part of the string this is called upon, that comes after
 * a given character (works with strings to). If the character is not part
 * of the string this is called upon, the function will return the full string.
 *
 * @param {String} char The character to get evrything after.
 * @returns {String} Everything after the given character.
 */
String.prototype.stringAfter = function (char) {
   // if char is not part of string return full string
   if (this.indexOf(char) == -1) return this;
   // else return only the part after char
   else return this.split(char)[1];
};

/**
 * Checks whether the number this is called upon is between
 * a given lower and higher bound. This includes the bounds!
 *
 * @param {Number} lower_bound The number should be bigger than this.
 * @param {Number} higher_bound The number should be smaller than this.
 * @returns {Boolean} Whether the number is inbetween given bounds.
 */
Number.prototype.between = function (lower_bound, higher_bound) {
   return this >= lower_bound && this <= higher_bound;
};

/**
 * Computes and returns a hash code for the string this is called upon. Hash codes
 * are returned as strings themself, so this can be called on them again if needed.
 *
 * This is a javascript implementation of javas hashCode function.
 * @see https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 *
 * @returns {String} The hash code as string.
 */
String.prototype.hashCode = function () {
   let hash;
   // compute hash from string
   for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      // Convert to 32bit integer
      hash = hash & hash;
   }
   // return as string
   return '' + hash;
};

/**
 * Checks and returns wheter the array this is called upon has duplicates.
 *
 * @returns {Boolean} The boolean whether the array has duplicates or not.
 */
Array.prototype.hasDuplicates = function () {
   // a set can not have the same element more than once - so if
   // a set created from all the elements of an array is smaller
   // than the array there must have been some duplicates
   return new Set(this).size != this.length;
};

/**
 * Removes the given element from the calling array.
 *
 * @param {Arraytype} element The element ro remove.
 */
Array.prototype.remove = function (element) {
   if (this.indexOf(element) == -1) return;
   this.splice(this.indexOf(element), 1);
};

/**
 * To be called on an html element. Returns its left position (x).
 *
 * @returns {Number} The left position of the element.
 */
Object.prototype.getX = function () {
   return parseInt(this.style.left);
};

/**
 * To be called on an html element. Returns its top position (y).
 *
 * @returns {Number} The top position of the element.
 */
Object.prototype.getY = function () {
   return parseInt(this.style.top);
};

/**
 * To be called on an html element. Moves the given amount horizontally.
 *
 * @param {Number} delta_x The amount to move the element horizontally.
 */
Object.prototype.moveX = function (delta_x) {
   // add delta x to the left position of the element
   this.style.left = this.getX() + delta_x + 'px';
};

/**
 * To be called on an html element. Moves the given amount vertically.
 *
 * @param {Number} delta_y The amount to move the element vertically.
 */
Object.prototype.moveY = function (delta_y) {
   // add delta y to the top position of the element
   this.style.top = this.getY() + delta_y + 'px';
};

/**
 * Returns the parent node of the calling html object at a given level.
 *
 * @param {Number} level The level of the parent node.
 * @returns The parent Node at the given level.
 */
Object.prototype.parent = function (level) {
   if (level == 0) return this;
   // if there is still a level to go recall
   // this function on this.parentNode
   return this.parentNode.parent(--level);
};
