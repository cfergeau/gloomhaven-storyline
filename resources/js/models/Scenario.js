import {ScenarioState} from "./ScenarioState";
import Storable from './Storable'
import Card from "./Card";
import ScenarioRepository from "../repositories/ScenarioRepository";
import ItemTextParser from "../services/ItemTextParser";

class Scenario {

    constructor(data) {
        this.id = data.id;
        this.root = data.root || false;
        this._name = data.name;
        this.coordinates = data.coordinates;
        this.is_side = data.is_side || false;
        this.pages = data.pages || [];
        this.requirements = data.requirements || "";
        this.quests = data.quests || [];
        this.cards = collect(data.cards).map((card) => new Card(card));
        this.chapter_id = data.chapter_id;
        this.chapter_name = null;
        this.region_ids = data.region_ids || [];
        this.regions = null;
        this.choices = data.choices;
        this._choice = null;
        this.hasChoices = typeof data.choices !== 'undefined';
        this._state = ScenarioState.hidden;
        this.notes = "";
        this.links_to = collect(data.links_to);
        this.linked_from = collect(data.linked_from);
        this.coupled = data.coupled;
        this.required_by = collect(data.required_by);
        this.blocks_on = collect(data.blocks_on);
        this.treasures = collect(data.treasures);
        this.treasures_from = collect(data.treasures_from);
        this.treasures_to = collect(data.treasures_to);
        this.unlockedTreasures = [];
        this.achievements_from_treasures = collect(data.achievements_from_treasures);
        this._rewards = collect(data.rewards);
        this._achievements_awarded = collect(data.achievements_awarded);
        this.achievements_awarded_by_choice = collect(data.achievements_awarded_by_choice);
        this.achievements_lost = collect(data.achievements_lost);
        this.prompt = data.prompt;
        this._promptChoice = null;
        this.hasPrompt = typeof data.prompt !== 'undefined';
        this.game = data.game;

        this.fieldsToStore = {
            "state": "_state",
            "choice": "_choice",
            "promptChoice": "_promptChoice",
            "notes": "notes",
            "treasures": {"unlockedTreasures": this.unlockedTreasures}
        };

        this.read();
    }

    isHidden() {
        return this.state === ScenarioState.hidden;
    }

    isVisible() {
        return this.state !== ScenarioState.hidden;
    }

    isComplete() {
        return this.state === ScenarioState.complete;
    }

    isIncomplete() {
        return this.state === ScenarioState.incomplete;
    }

    isBlocked() {
        return this.state === ScenarioState.blocked;
    }

    isRequired() {
        return this.state === ScenarioState.required;
    }

    set state(state) {
        if (this._state === state) {
            return;
        }
        this._state = state;
        this.store();
    }

    get state() {
        return this._state;
    }

    set choice(choice) {
        if (this._choice === choice) {
            return;
        }
        this._choice = choice;
        this.store();
    }

    get choice() {
        return this._choice;
    }

    set promptChoice(choice) {
        if (this._promptChoice === choice) {
            return;
        }
        this._promptChoice = choice;
        this.store();
    }

    get promptChoice() {
        return this._promptChoice;
    }

    get name() {
        return app.$t('scenarios.' + this._name);
    }

    get title() {
        return `#${this.id} ${this.name}`;
    }

    unlockTreasure(id, unlock = true) {
        if (!unlock) {
            return this.lockTreasure(id);
        }

        if (!this.treasures.has(id) || this.isTreasureUnlocked(id)) {
            return;
        }

        this.unlockedTreasures.push(id);
        this.store();
    }

    lockTreasure(id) {
        if (!this.treasures.has(id) || !this.isTreasureUnlocked(id)) {
            return;
        }

        this.unlockedTreasures.splice(this.unlockedTreasures.indexOf(id));
        this.store();
    }

    isTreasureUnlocked(id) {
        return this.unlockedTreasures.indexOf(id) >= 0
    }

    inRegion(id) {
        return this.region_ids.indexOf(id) >= 0
    }

    get missedTreasures() {
        return this.isComplete() && this.treasures.count() > this.unlockedTreasures.length;
    }

    get lootedAllTreasures() {
        return this.treasures.count() > 0 && this.treasures.count() === this.unlockedTreasures.length;
    }

    hasCard() {
        return this.cards.count() > 0;
    }

    image() {
        if (this.coupled && this.isBlocked()) {
            if ((new ScenarioRepository).find(this.coupled).isComplete()) {
                return '/img/scenarios/' + this.coupled + '_c' + '.png'
            }
        }

        return '/img/scenarios/' + this.id + (this.isComplete() ? '_c' : '') + '.png'
    }

    get rewards() {
        let rewards = collect();

        if (typeof this._rewards.first() === 'string') {
            rewards = this._rewards;
        } else if (Array.isArray(this._rewards.first()) && this.promptChoice) {
            rewards = collect(this._rewards.get(this.promptChoice - 1));
        }

        return rewards;
    }

    get achievements_awarded() {
        let achievements = this._achievements_awarded;

        if (this.achievements_awarded_by_choice.isNotEmpty() && this.promptChoice) {
            achievements = achievements.merge(this.achievements_awarded_by_choice.get(this.promptChoice - 1) || []);
        }

        return achievements;
    }

    rewardItems() {
        let items = collect();

        this.rewards.each(reward => {
            items = items.merge((new ItemTextParser()).ids(reward).items);
        });

        return items;
    }

    key() {
        return 'scenario-' + this.id;
    }

}

Object.assign(Scenario.prototype, Storable);

export default Scenario
