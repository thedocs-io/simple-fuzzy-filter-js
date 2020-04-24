import 'core-js/features/array/for-each';
import 'core-js/features/array/find';
import {SimpleFuzzyFilterTokenizedItem, SimpleFuzzyFilterTokenizer} from "./simple-fuzzy-filter-tokenizer";
import {SimpleFuzzyFilterItemTextProvider} from "./simple-fuzzy-filter-js";

export type SimpleFuzzyFilterItemData<T> = {
  item: T;
  text: SimpleFuzzyFilterTokenizedItem[];
}

export class SimpleFuzzyFilterItemsIndex<T> {

  private items_: SimpleFuzzyFilterItemData<T>[];
  private textProvider: SimpleFuzzyFilterItemTextProvider<T>;
  private tokenizer: SimpleFuzzyFilterTokenizer;

  constructor(textProvider: SimpleFuzzyFilterItemTextProvider<T>, tokenizer: SimpleFuzzyFilterTokenizer) {
    this.textProvider = textProvider;
    this.tokenizer = tokenizer;
    this.items_ = [];
  }

  get items(): SimpleFuzzyFilterItemData<T>[] {
    return this.items_;
  }

  add(item: T): void {
    this.items_.push({
      item: item,
      text: this.tokenizer.tokenize(this.textProvider(item))
    });
  }

  addAll(items: T[]): void {
    items.forEach(item => this.add(item));
  }

  remove(item: T): void {
    const itemIndexed = this.items_.find(i => i.item == item);

    if (itemIndexed) {
      this.items_.splice(this.items_.indexOf(itemIndexed), 1);
    }
  }

  removeAll(items: T[]): void {
    items.forEach(item => this.remove(item));
  }
}
