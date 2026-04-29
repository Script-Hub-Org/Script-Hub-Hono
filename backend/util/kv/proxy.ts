import { $app } from "../env/app";

export class KV {
  async get(key: string) {
    switch ($app) {
      case "Shadowrocket":
      case "Egern":
      case "Loon":
      case "Stash":
      case "Surge": {
        // @ts-ignore
        return $persistentStore.read(key);
      }
      case "Quantumult X": {
        // @ts-ignore
        return $prefs.valueForKey(key);
      }
      default:
        throw new Error("Unsupported App");
    }
  }

  async set(key: string, value: string) {
    switch ($app) {
      case "Shadowrocket":
      case "Egern":
      case "Loon":
      case "Stash":
      case "Surge": {
        // @ts-ignore
        return $persistentStore.write(value, key);
      }
      case "Quantumult X": {
        // @ts-ignore
        return $prefs.setValueForKey(value, key);
      }
      default:
        throw new Error("Unsupported App");
    }
  }
}
