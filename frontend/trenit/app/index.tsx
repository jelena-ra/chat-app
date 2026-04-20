import { Redirect } from "expo-router";
import { TextEncoder } from 'text-encoding';

globalThis.TextEncoder = TextEncoder;

export default function Index() {

      return <Redirect href="/registration"></Redirect>

}
