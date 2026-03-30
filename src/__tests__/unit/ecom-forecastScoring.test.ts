diff --git a/src/__tests__/unit/ecom-forecastScoring.test.ts b/src/__tests__/unit/ecom-forecastScoring.test.ts
new file mode 100644
index 0000000..baf8f48
--- /dev/null
+++ b/src/__tests__/unit/ecom-forecastScoring.test.ts
@@ -0,0 +1,28 @@
+import { calculateEcomForecastScore } from "@/lib/ecom/forecastScoring";
+
+describe("calculateEcomForecastScore", () => {
+  it("returns deterministic score with explainable reasons", () => {
+    const result = calculateEcomForecastScore({
+      productId: "sku-test-001",
+      productName: "Test Product",
+      conversionRate: 0.05,
+      marginRate: 0.5,
+      weeklyTraffic: 10000,
+      trendVelocity: 0,
+    });
+
+    // 0.05*40 + 0.5*25 + min(20, 10000/10000*20) + ((0+1)/2*15)
+    // = 2 + 12.5 + 20 + 7.5 = 42 -> rounded
+    expect(result.score).toBe(42);
+    expect(result.reasons).toHaveLength(4);
+    expect(result.reasons[0].key).toBe("conversion");
+    expect(result.reasons[1].key).toBe("margin");
+    expect(result.reasons[2].key).toBe("traffic");
+    expect(result.reasons[3].key).toBe("trend");
+    expect(result.reasons[0].message).toContain("Conversion rate");
+  });
+});
