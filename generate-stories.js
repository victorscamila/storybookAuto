const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const componentsDir = "../prototype/src/components";

// Helper function to generate example values for objects and arrays of objects
function generateExampleValue(type) {
  if (!type) {
    return 'not a type'; // Fallback for undefined types
  }

  if (typeof type !== "string") {
    return type; // Fallback for non-string types
  }

  if (type === "string") {
    return "example";
  } else if (type === "number") {
    return 0;
  } else if (type === "boolean") {
    return false;
  }  else if (type.endsWith("[]")) {
    const innerType = type.replace("[]", "").trim();
    if (innerType.startsWith("{") && innerType.endsWith("}")) {
      // Array of objects
      const exampleObject = generateExampleValue(innerType);
      return exampleObject ? [exampleObject] : [];
    } else {
      // Array of primitive types
      const exampleValue = generateExampleValue(innerType);
      return exampleValue ? [exampleValue] : [];
    }
  } else if (type.startsWith("{")) {
    // Object type
    const objectExample = {};
    const properties = type.slice(1, -1).split(";").map(prop => prop.trim());
    properties.forEach(prop => {
      if (prop) {
        let [key, valueType] = prop.split(":").map(s => s.trim());
        key = key.replace("?","")
        if (key && valueType) {
          objectExample[key.replace(/['"]+/g, "")] = generateExampleValue(valueType);
        }
      }
    });
    return objectExample;
  } else {
    // Fallback for unknown types
    return type;
  }
}

// Function to extract prop types from a TypeScript file
function extractPropTypes(componentName, filePath) {
  const program = ts.createProgram([filePath], {});
  const sourceFile = program.getSourceFile(filePath);
  const typeChecker = program.getTypeChecker();
  let propTypes = {};
  let defaultArgs = {};

  ts.forEachChild(sourceFile, node => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === `${componentName}Props`) {
      node.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
          const propName = member.name.text;
          const type = typeChecker.typeToString(typeChecker.getTypeAtLocation(member.type));
          const isRequired = !member.questionToken; // Check if the prop is required

          // Handle union types to select type
          if (type && type.includes('|')) {
            const options = type.split('|').map(t => t.trim().replace(/['"]+/g, ''));
            propTypes[propName] = {
              control: {
                type: 'select',
                options: options
              }
            };
            // Add the first option as the default value for required props
            if (isRequired) {
              defaultArgs[propName] = options[0];
            }
          } else if (type && isRequired) {
            // Handle other types (string, number, array, object, etc.) for required props only
            defaultArgs[propName] = generateExampleValue(type);
          }
        }
      });
    }
  });

  return { propTypes, defaultArgs };
}

// Helper function to remove quotes from keys in JSON.stringify output
function stringifyWithoutQuotes(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/"(\w+)":/g, "$1:"); // Remove quotes from keys
}

// Story template function
const storyTemplate = (componentName, argTypes, defaultArgs) => `
import type { Meta, StoryObj } from '@storybook/react';
import ${componentName} from "./";

const meta = {
  title: "Components/${componentName}",
  component: ${componentName},
  argTypes: ${stringifyWithoutQuotes(argTypes)},
  tags: ['autodocs'],
  args: ${stringifyWithoutQuotes(defaultArgs)},
} satisfies Meta<typeof ${componentName}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Main: Story = {}

`;

// Read the components directory
fs.readdirSync(componentsDir).forEach((component) => {
  const componentPath = path.join(componentsDir, component, "index.tsx");
  const storyPath = path.join(componentsDir, component, `${component}.stories.tsx`);

  // Check if index.tsx exists
  if (!fs.existsSync(componentPath)) {
    console.log(`No index.tsx found for component: ${component}`);
    return; // Skip this component
  }

  const { propTypes, defaultArgs } = extractPropTypes(component, componentPath);
  fs.writeFileSync(storyPath, storyTemplate(component, propTypes, defaultArgs));
  console.log(`Story created/replaced: ${storyPath}`);
});