import styles from '../../styles/pages.module.css';

export function FichaModeloE() {
  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1>Ficha Modelo "E"</h1>
        <p>Confeccione a Ficha Modelo "E" do militar.</p>
      </div>
      <div className={styles['empty-page']}>
        <span className={styles['empty-page__icon']}>📝</span>
        <h2>Em desenvolvimento</h2>
        <p>O formulário da Ficha Modelo "E" será implementado em breve.</p>
      </div>
    </div>
  );
}
