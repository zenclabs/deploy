import * as awsAuth from "../service/aws/auth";
import * as console from "../service/console";
import * as docker from "../service/docker";
import * as inquirer from "inquirer";
import * as regions from "../service/aws/resources/regions";

const MAX_NAME_LENGTH = 8;

export function checkedEnvironmentAction(f: (...args: any[]) => Promise<any>) {
  async function checked(...args: any[]) {
    await awsAuth.authenticate();
    await docker.checkEnvironment();
    await f(...args);
  }
  return (...args: any[]) => {
    checked(...args)
      .catch(error => {
        console.logError(error);
        process.exit(1);
      })
      .then(() => {
        process.exit(0);
      });
  };
}

export async function inputName(message: string): Promise<string> {
  let answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: message,
      validate(input: string): true | string {
        if (typeof input !== "string" || !input.match(/^[a-z][a-z0-9]*$/)) {
          return "Please enter an alphanumeric sequence starting with a character.";
        }
        if (input.length > MAX_NAME_LENGTH) {
          return `Please enter a shorter name (max ${MAX_NAME_LENGTH} characters).`;
        }
        return true;
      }
    }
  ]);
  return answers["name"];
}

export async function inputInteger(
  message: string,
  defaultValue?: number
): Promise<number> {
  let answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: message,
      validate(input: string): true | string {
        if (input.length > 0 && parseInt(input).toString(10) !== input) {
          return "Please enter an integer.";
        }
        return true;
      },
      default: defaultValue
    }
  ]);
  return answers["name"];
}

export async function ensureRegionProvided<T extends { region?: string }>(
  options: T
): Promise<
  T & {
    region: string;
  }
> {
  if (!options.region) {
    let answers = await inquirer.prompt([
      {
        type: "list",
        name: "region",
        message: "Which region do you want to create your cluster in?",
        choices: regions.ECS_REGIONS.map(region => {
          return `${region.id} - ${region.label}`;
        })
      }
    ]);
    [options.region] = answers["region"].split(" ");
    if (!options.region) {
      throw new Error();
    }
  }
  return options as any;
}