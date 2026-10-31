import { describe, expect, it } from "vitest";
import { initialState, type QuestState } from "@crowdquest/shared";
import { getPartyHealthShift } from "../src/PartyImpact";

const phase = (state:QuestState, p:QuestState["phase"]) => ({ ...state, phase:p });

describe("authentic party health feedback",()=>{
  it("recognizes actual net loss or recovery, but never fabricates both",()=>{
    const a=phase(initialState(8),"encounter");
    const hurt={...a,phase:"consequence" as const,health:61};
    expect(getPartyHealthShift(a,hurt)).toEqual({direction:"hurt",delta:-39});
    const rally={...hurt,health:71};
    expect(getPartyHealthShift(hurt,rally)).toEqual({direction:"recovered",delta:10});
    expect(getPartyHealthShift(hurt,{...hurt})).toBeNull();
  });
  it("rejects new sessions and resets instead of flashing old HP changes",()=>{
    const a=phase(initialState(8),"finale");
    const restart={...initialState(9),health:100};
    expect(getPartyHealthShift(a,restart)).toBeNull();
    expect(getPartyHealthShift(a,{...initialState(8)})).toBeNull();
    expect(getPartyHealthShift(initialState(8),{...a,health:60})).toBeNull();
  });
  it("rejects invalid health numbers",()=>{
    const a=phase(initialState(8),"encounter");
    expect(getPartyHealthShift(a,{...a,health:Number.NaN})).toBeNull();
    expect(getPartyHealthShift(a,{...a,health:Number.POSITIVE_INFINITY})).toBeNull();
  });
});
