import { usePriceWatch } from "../../hooks/usePriceWatch";
import { money } from "../../utils";
import { PriceTagIcon } from "../icons";

export default function PriceWatchPanel() {
  const { priceWatch, isLoading, errorMessage } = usePriceWatch();
  const comparisons = priceWatch?.comparisons ?? [];
  const savingTips = comparisons.filter((comparison) => comparison.savings > 0);

  return (
    <div className="settings-group insights-group">
      <h3>
        <PriceTagIcon /> Price Watch
      </h3>
      <p className="description">
        Compares what you paid for the same things at different stores over the last year.
      </p>
      {isLoading && <p className="description">Comparing your receipts...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {!isLoading && !errorMessage && comparisons.length === 0 && (
        <p className="empty">Buy the same thing twice and prices show up here.</p>
      )}
      {savingTips.length > 0 && (
        <ul className="price-tips">
          {savingTips.slice(0, 3).map((comparison) => (
            <li key={comparison.product} className="price-tip">
              {comparison.tip}
            </li>
          ))}
        </ul>
      )}
      {comparisons.length > 0 && (
        <table className="price-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Cheapest</th>
              <th>Last paid</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => (
              <tr key={comparison.product}>
                <td>
                  {comparison.product}
                  <span className="price-table-count">bought {comparison.purchase_count}x</span>
                </td>
                <td>
                  {money(comparison.cheapest_price)}
                  <span className="price-table-store">{comparison.cheapest_store}</span>
                </td>
                <td className={comparison.savings > 0 ? "price-table-higher" : ""}>
                  {money(comparison.latest_price)}
                  <span className="price-table-store">{comparison.latest_store}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
