<h1 style= 'text-align: center;'> ✈ Aviation Risk Analysis Project</h1>

---


## 📘 Project Overview

In this project, I will use data cleaning, imputation, analysis, and visualization to generate insights for a business stakeholder.
The company is expanding into new industries to diversify its portfolio. Specifically, they are interested in purchasing and operating airplanes for commercial and private enterprises, but do not currently know anything about the potential risks of aircraft.

I have been tasked with determining which aircraft have the lowest risk to help guide this new business venture. The results will inform actionable insights for the head of the new aviation division regarding aircraft purchasing decisions.

To determine which aircraft pose the least risk, we applied a process of elimination by filtering out aircraft categories with high accident rates or unreliable data. This ensured that our recommendations are based only on reliable and low-risk options.

## 💼 Work Completed

1. **Data Cleaning**
   - Loaded and filtered relevant columns from the dataset (AviationData.csv).
   - Handled missing values and dropped incomplete rows.
   - Created new features such as Total.Injured and extracted Year from Event.Date.
---

2. **Accident Rate Analysis by Aircraft Category**
   - Grouped the data by Aircraft.Category and calculated the total number of accidents.
   - Computed accident rates to normalize accident counts across categories.
   - Identified categories with the lowest and highest accident rates.
---

3. **Severity-Based Analysis**
   - Evaluated accident severity within each aircraft category.
   - Calculated accident rates for each severity level to assess risk exposure.
---


4. **Aircraft Damage Impact**
   - Compared the frequency and rate of accidents based on the extent of aircraft damage.
   - Highlighted how different aircraft types and damage categories contribute to overall risk.
---


5. **Final Aircraft Selection Based on Combined Safety Criteria**

---
### Summary

All remaining aircraft—*Gyrocraft*, *Powered Parachute*, and *WSFT*—meet the following safety criteria:
- Involved only in *non-fatal* accidents
- All used *1 reciprocating engine*
- Accidents occurred during *personal use*
- All models were from the year *2022*

However, key differences emerge upon deeper inspection:

- *Damage Level*:
  - *Powered Parachute* experienced a *"Destroyed"* outcome, indicating a total loss. This level of damage implies significantly higher repair or replacement costs and increased risk.
  - In contrast, *Gyrocraft* and *WSFT* were both classified as *"Substantial"* damage — serious but typically repairable.

- *Purpose of Flight*:
  - All incidents occurred during *personal* flights. No accidents related to *business*, *instructional*, or *commercial* use were recorded in this subset.
  - This limits the generalizability of the findings for other flight purposes. Any future consideration of these aircraft for broader usage should be approached with additional caution and data.

Based on the full set of safety indicators:

- *Gyrocraft* is the most reliable choice. It combines a clean safety record (non-fatal, substantial damage only) with consistent configuration and modern manufacture.
- *WSFT* is a close second, presenting similar characteristics and performance in the filtered dataset.

While *Powered Parachute* meets basic safety criteria, its involvement in a "Destroyed" level incident makes it a *less favorable option* for immediate selection. It may still be considered in secondary scenarios, but with increased attention to cost implications and physical vulnerability.

##### If a final decision must be made, *Gyrocraft* and *WSFT* are the most appropriate and lowest-risk options.


