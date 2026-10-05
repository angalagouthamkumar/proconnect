import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import UserLayout from "../layout/userLayout";

export default function Home() {

  const router = useRouter();

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainerLeft}>
            <p>Connect with friends without exaggeration</p>
            <p>A true social media platform, with stories no bluffs.</p>

            <div className={styles.buttonJoin} onClick={() => router.push("/login")}>
              <p>Join Now</p>
            </div>
          </div>
          <div className={styles.mainContainerRight}>
            <img src="images/proconnect.jpeg" alt="image" /> 
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
