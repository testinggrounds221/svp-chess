// It is getting better.
// Feedback Points:
// * 1) Shud highlight last moved sqrs, so that it is clear who shud move next: white or black. 

// * 2) Can have a checkBox to decide whether topSpin is allowed or not ( at the start of the game).
// Default is : no topSpin and no force control (target piece gets pushed to the farthest sqr. )

// * 3) When topSpin, forceControl option is allowed :  
// Dialog1: Title: Force Control : Select final position of the target piece:
// Now user has to enter e4, e5 etc.
// Instead, we Can give radio bottons: +1(e4), +2(e5), +3(e6) etc.
// Default selected being the farthest square.
// Dialog can always have 8 radio buttons and u can grey out the unreachable options?

// Dialog2:Title: TopSpin Control : Select final position of the attacking piece:
// Now user has to enter e4, e5 etc.
// Instead, we Can give radio bottons: 0(e3), +1(e4), +2(e5), +3(e6) etc.
// Default selected being the nearest sqr : 0(e3) option. 
// Dialog can always have 8 radio buttons and u can grey out the unreachable options. 

// 
// * 4) the column below 1 can be "0". So A row has total of 10 sqares:  A0, A1, A2, ..., A8, A9.
// The row below A can be "Z". So column 1 has total of 10 sqares:  Z1, A1, B1, ..., H1, I1.

// TODO 5) saving FGN, PGN for pool chess will be needed. 

// TODO 6) several things like PGN, clock, last mv sqr highlighting etc. r commong for Boom, Xray, Pool etc. chess. So it will be good, if the main software is kept the same, and which rule is applied is decided based on user selection at start of the game. This may be easier to avoid repetitive coding.  Future can add more rule books for other new variants.