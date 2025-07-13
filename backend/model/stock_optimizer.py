from pulp import LpProblem, LpVariable, LpMinimize, lpSum, LpStatus

def optimize_stock(predictions, total_stock):
    """
    predictions: dict of region: predicted_demand
    total_stock: total stock units available
    """
    model = LpProblem("Stock_Allocation", LpMinimize)

    regions = list(predictions.keys())
    total_predicted = sum(predictions.values())

    # Create allocation variables (integer and non-negative)
    alloc_vars = {
        region: LpVariable(f"stock_{region}", lowBound=0, cat='Integer')
        for region in regions
    }

    # Constraint: total allocated stock must match available stock
    model += lpSum(alloc_vars[r] for r in regions) == total_stock

    # Target proportion each region should get
    target_allocation = {
        r: total_stock * (predictions[r] / total_predicted)
        for r in regions
    }

    # Objective: minimize sum of absolute deviations from target allocation
    # Use auxiliary variables to linearize absolute differences
    deviation_vars = {
        r: LpVariable(f"deviation_{r}", lowBound=0)
        for r in regions
    }

    for r in regions:
        model += alloc_vars[r] - target_allocation[r] <= deviation_vars[r]
        model += target_allocation[r] - alloc_vars[r] <= deviation_vars[r]

    model += lpSum(deviation_vars[r] for r in regions)

    # Solve
    model.solve()

    # Final allocation
    allocation = {r: int(alloc_vars[r].varValue) for r in regions}
    return allocation
